"""
dashboard.py ─ Dashboard endpoints.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, text, and_, or_, exists, cast, Date, extract
from sqlalchemy.orm import Session, aliased, joinedload, selectinload, load_only

from app.api.deps import get_db, get_current_user
from app.core.rbac import Role, require_roles
from app.api.routers.documents import check_document_access

# Models
from app.models.assignment import AuditorAssignmentModel, ProcessorAssignmentModel
from app.models.document import (
    RopaDocumentModel,
    DocumentDeletionRequestModel,
    RopaRiskAssessmentModel,
)
from app.models.user import UserModel
from app.models.workflow import (
    ReviewDpoAssignmentModel,
    DocumentReviewCycleModel,
    ReviewAssignmentModel,
    ReviewFeedbackModel,
)
from app.models.dpo_comment import DpoSectionCommentModel
from app.models.master_data import MstDepartmentModel
from app.models.section_owner import RopaOwnerSectionModel
from app.models.section_processor import RopaProcessorSectionModel

from app.schemas.enums import (
    DocumentStatusEnum,
    RiskLevelEnum,
    ReviewStatusEnum,
    RopaSectionEnum,
    DeletionStatusEnum,
    AssignmentStatusEnum,
    FeedbackStatusEnum,
    FeedbackTargetEnum,
)

# Schemas
from app.schemas.user import UserRead
from app.schemas.dashboard import (
    AdminDashboardResponse,
    AdminUserDashboardResponse,
    DpoDashboardResponse,
    PaginatedDpoDocumentTableResponse,
    DpoDocumentTableItem,
    DocumentStatusFlags,
    PaginatedDpoDestructionTableResponse,
    DpoDestructionTableItem,
    DpoDestructionReviewRequest,
    PaginatedDpoAuditorAssignmentTableResponse,
    DpoAuditorAssignmentTableItem,
    PaginatedOwnerDpoReviewedDocumentResponse,
    OwnerDpoReviewedDocumentTableItem,
    AuditorDashboardResponse,
    ProcessorDashboardResponse,
    UserDashboardResponse,
    UserDashboardStatistics,
)
from app.schemas.owner import OwnerDashboardResponse
from app.schemas.executive import (
    ExecutiveDashboardResponse,
    RopaStatusOverview,
    RiskByDepartment,
    SensitiveDocByDepartment,
    PendingDocuments,
    ApprovedDocumentsSummary,
    PendingDpoReviewSummary,
)
from app.schemas.dpo_comment import DpoCommentBulkRequest, DpoCommentRead

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    summary="Admin: Organisation Dashboard",
    tags=["Dashboard (Admin)"],
)
def org_dashboard(
    period: str = Query(
        "30_days", description="Filter period: 7_days, 30_days, 6_months, 1_year, overdue, custom, all"
    ),
    custom_date: Optional[str] = Query(
        None, description="Format YYYY-MM-DD. Required if period=custom"
    ),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    if period == "custom" and not custom_date:
        raise HTTPException(
            status_code=400, detail="custom_date is required when period is custom"
        )

    return _get_org_metrics_internal(db, period, custom_date)


def _get_org_metrics_internal(
    db: Session, period: str, custom_date: Optional[str] = None
):
    now = datetime.now(timezone.utc)
    base_filters = []

    if period == "7_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=7))
    elif period == "30_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=30))
    elif period == "6_months":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=180))
    elif period == "1_year":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=365))
    elif period == "this_month":
        cutoff = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        base_filters.append(RopaDocumentModel.created_at >= cutoff)
    elif period == "this_year":
        cutoff = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        base_filters.append(RopaDocumentModel.created_at >= cutoff)
    elif period == "overdue":
        base_filters.append(RopaDocumentModel.due_date < now)
        base_filters.append(RopaDocumentModel.status.notin_(["COMPLETED", "EXPIRED"]))
    elif period == "custom" and custom_date:
        try:
            c_date = datetime.strptime(custom_date, "%Y-%m-%d").date()
            base_filters.append(cast(RopaDocumentModel.created_at, Date) == c_date)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid custom_date format. Use YYYY-MM-DD"
            )

    base_query = db.query(RopaDocumentModel.id).filter(*base_filters).correlate(None)

    # 1. Document Overview
    total_docs = base_query.count()
    status_counts = (
        db.query(
            RopaDocumentModel.status, func.count(RopaDocumentModel.id).label("count")
        )
        .filter(*base_filters)
        .group_by(RopaDocumentModel.status)
        .all()
    )

    docs_by_status = {
        str(getattr(row.status, "value", row.status)): row.count
        for row in status_counts
    }

    overview_map = {
        "draft": docs_by_status.get("IN_PROGRESS", 0),
        "pending": docs_by_status.get("PENDING", 0),
        "reviewing": docs_by_status.get("UNDER_REVIEW", 0),
        "completed": docs_by_status.get("COMPLETED", 0),
    }

    def format_stat(q, completed_statuses):
        total = q.count()
        rows = q.all()
        completed = sum(
            1
            for r in rows
            if getattr(r, "status", None)
            and getattr(r.status, "value", r.status) in completed_statuses
        )
        return {"completed": completed, "incomplete": total - completed}

    # Data Owner Sections (COMPLETED = SUBMITTED)
    owner_q = db.query(RopaOwnerSectionModel.id, RopaOwnerSectionModel.status).filter(
        RopaOwnerSectionModel.document_id.in_(base_query)
    )
    owner_stats = format_stat(owner_q, ["SUBMITTED"])

    # Data Processor Sections (COMPLETED = SUBMITTED)
    proc_q = db.query(
        RopaProcessorSectionModel.id, RopaProcessorSectionModel.status
    ).filter(RopaProcessorSectionModel.document_id.in_(base_query))
    proc_stats = format_stat(proc_q, ["SUBMITTED"])

    # DPO Docs (APPROVED)
    dpo_q = db.query(
        DocumentReviewCycleModel.id, DocumentReviewCycleModel.status
    ).filter(DocumentReviewCycleModel.document_id.in_(base_query))
    dpo_stats = format_stat(dpo_q, ["APPROVED"])

    # Auditor Docs (VERIFIED)
    auditor_q = db.query(
        AuditorAssignmentModel.id, AuditorAssignmentModel.status
    ).filter(AuditorAssignmentModel.document_id.in_(base_query))
    auditor_stats = format_stat(auditor_q, ["VERIFIED"])

    # Revisions
    rev_owner_q = (
        db.query(ReviewAssignmentModel.id, ReviewAssignmentModel.status)
        .join(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id.in_(base_query),
            ReviewAssignmentModel.role == "OWNER",
        )
    )
    rev_owner_stats = format_stat(rev_owner_q, ["COMPLETED"])

    rev_proc_q = (
        db.query(ReviewAssignmentModel.id, ReviewAssignmentModel.status)
        .join(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id.in_(base_query),
            ReviewAssignmentModel.role == "PROCESSOR",
        )
    )
    rev_proc_stats = format_stat(rev_proc_q, ["COMPLETED"])

    # Deletions
    del_stats = (
        db.query(
            RopaDocumentModel.deletion_status,
            func.count(RopaDocumentModel.id).label("count"),
        )
        .filter(RopaDocumentModel.deletion_status.isnot(None), *base_filters)
        .group_by(RopaDocumentModel.deletion_status)
        .all()
    )

    del_map = {
        (
            getattr(row.deletion_status, "value", row.deletion_status)
            if row.deletion_status
            else "NONE"
        ): row.count
        for row in del_stats
    }

    return AdminDashboardResponse(
        selected_period=period,
        document_overview={
            "total": total_docs,
            "statuses": {
                "draft": overview_map["draft"],
                "pending": overview_map["pending"],
                "reviewing": overview_map["reviewing"],
                "completed": overview_map["completed"],
            },
        },
        role_based_stats={
            "data_owner_docs": {"title": "เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล", **owner_stats},
            "processor_docs": {
                "title": "เอกสารทั้งหมดของผู้ประมวลผลข้อมูลส่วนบุคคล",
                **proc_stats,
            },
            "dpo_docs": {
                "title": "เอกสารทั้งหมดที่ต้องตรวจโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล",
                **dpo_stats,
            },
            "auditor_docs": {
                "title": "เอกสารทั้งหมดที่ต้องตรวจสอบโดยผู้ตรวจสอบ",
                **auditor_stats,
            },
        },
        revision_and_deletion_stats={
            "owner_revisions": {
                "title": "เอกสารทั้งหมดที่รอผู้รับผิดชอบข้อมูลแก้ไข",
                **rev_owner_stats,
            },
            "processor_revisions": {
                "title": "เอกสารทั้งหมดที่รอผู้ประมวลผลข้อมูลส่วนบุคคลแก้ไข",
                **rev_proc_stats,
            },
            "destroyed_docs": {
                "title": "เอกสารทั้งหมดที่ถูกทำลาย",
                "completed": del_map.get("DELETED", 0),
                "incomplete": 0,
            },
            "due_for_destruction": {
                "title": "เอกสารทั้งหมดที่ครบกำหนดทำลาย",
                "completed": 0,
                "incomplete": del_map.get("DELETE_PENDING", 0),
            },
        },
    )


# --- Metric Helpers ---


def _get_owner_metrics_internal(db: Session, user_id: int, period: str = "all"):
    """
    Robust version of Data Owner metrics calculation
    """
    now = datetime.now(timezone.utc)
    uid = user_id
    base_q = db.query(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid)

    base_filters = []
    if period == "7_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=7))
    elif period == "30_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=30))
    elif period == "6_months":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=180))
    elif period == "1_year":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=365))

    base_q = db.query(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, *base_filters)

    doc_ids_q = db.query(RopaDocumentModel.id).filter(RopaDocumentModel.created_by == uid, *base_filters)

    # 1. Total
    total = base_q.count()

    # 2. Needs Fix (DO / DP)
    needs_fix_do = (
        db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id)))
        .join(
            ReviewFeedbackModel,
            ReviewFeedbackModel.review_cycle_id == DocumentReviewCycleModel.id,
        )
        .join(
            RopaDocumentModel,
            RopaDocumentModel.id == DocumentReviewCycleModel.document_id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            ReviewFeedbackModel.to_user_id == uid,
            ReviewFeedbackModel.status == FeedbackStatusEnum.OPEN,
        )
        .scalar()
        or 0
    )

    dp_fix_from_dpo = set(
        row[0]
        for row in (
            db.query(DocumentReviewCycleModel.document_id)
            .join(
                ReviewFeedbackModel,
                ReviewFeedbackModel.review_cycle_id == DocumentReviewCycleModel.id,
            )
            .join(
                ProcessorAssignmentModel,
                ProcessorAssignmentModel.document_id
                == DocumentReviewCycleModel.document_id,
            )
            .join(
                RopaDocumentModel,
                RopaDocumentModel.id == DocumentReviewCycleModel.document_id,
            )
            .filter(
                RopaDocumentModel.id.in_(doc_ids_q),
                ReviewFeedbackModel.to_user_id
                == ProcessorAssignmentModel.processor_id,
                ReviewFeedbackModel.status == FeedbackStatusEnum.OPEN,
            )
            .all()
        )
    )
    dp_fix_from_do = set(
        row[0]
        for row in (
            db.query(RopaDocumentModel.id)
            .join(
                RopaProcessorSectionModel,
                RopaProcessorSectionModel.document_id == RopaDocumentModel.id,
            )
            .join(
                ReviewFeedbackModel,
                ReviewFeedbackModel.target_id == RopaProcessorSectionModel.id,
            )
            .filter(
                RopaDocumentModel.id.in_(doc_ids_q),
                ReviewFeedbackModel.status == FeedbackStatusEnum.OPEN,
            )
            .all()
        )
    )
    needs_fix_dp = len(dp_fix_from_dpo | dp_fix_from_do)

    # 3. Risk Levels
    _risk_base = (
        db.query(RopaRiskAssessmentModel)
        .join(
            RopaDocumentModel,
            RopaRiskAssessmentModel.document_id == RopaDocumentModel.id,
        )
        .filter(RopaDocumentModel.id.in_(doc_ids_q))
    )
    risk_low = _risk_base.filter(
        RopaRiskAssessmentModel.risk_level == RiskLevelEnum.LOW
    ).count()
    risk_medium = _risk_base.filter(
        RopaRiskAssessmentModel.risk_level == RiskLevelEnum.MEDIUM
    ).count()
    risk_high = _risk_base.filter(
        RopaRiskAssessmentModel.risk_level == RiskLevelEnum.HIGH
    ).count()

    # 4. Under Review
    under_review_storage = base_q.filter(
        RopaDocumentModel.status == DocumentStatusEnum.UNDER_REVIEW,
        RopaDocumentModel.deletion_status.is_(None),
    ).count()
    under_review_deletion = base_q.filter(
        RopaDocumentModel.deletion_status == DeletionStatusEnum.DELETE_PENDING,
    ).count()

    # 5. Pending (Drafts)
    pending_do = (
        db.query(func.count(RopaOwnerSectionModel.id))
        .join(
            RopaDocumentModel,
            RopaOwnerSectionModel.document_id == RopaDocumentModel.id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            RopaDocumentModel.status == DocumentStatusEnum.IN_PROGRESS,
            RopaOwnerSectionModel.status == RopaSectionEnum.DRAFT,
        )
        .scalar()
        or 0
    )
    pending_dp = (
        db.query(func.count(RopaProcessorSectionModel.id))
        .join(
            RopaDocumentModel,
            RopaProcessorSectionModel.document_id == RopaDocumentModel.id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            RopaDocumentModel.status == DocumentStatusEnum.IN_PROGRESS,
            RopaProcessorSectionModel.status == RopaSectionEnum.DRAFT,
        )
        .scalar()
        or 0
    )

    # 6. Completed
    completed = base_q.filter(
        RopaDocumentModel.status == DocumentStatusEnum.COMPLETED
    ).count()

    # 7. Sensitive Documents
    from app.models.section_owner import OwnerDataTypeModel

    sensitive = (
        db.query(func.count(func.distinct(RopaOwnerSectionModel.document_id)))
        .join(
            OwnerDataTypeModel,
            OwnerDataTypeModel.owner_section_id == RopaOwnerSectionModel.id,
        )
        .join(
            RopaDocumentModel,
            RopaOwnerSectionModel.document_id == RopaDocumentModel.id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            func.lower(OwnerDataTypeModel.type) == "sensitive",
        )
        .scalar()
        or 0
    )

    # 8. Overdue DP
    overdue_dp = (
        db.query(func.count(ProcessorAssignmentModel.id))
        .join(
            RopaDocumentModel,
            ProcessorAssignmentModel.document_id == RopaDocumentModel.id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            RopaDocumentModel.status == DocumentStatusEnum.IN_PROGRESS,
            ProcessorAssignmentModel.due_date != None,
            ProcessorAssignmentModel.due_date <= now,
            ProcessorAssignmentModel.status != AssignmentStatusEnum.SUBMITTED,
        )
        .scalar()
        or 0
    )

    # 11. Deleted
    deleted = base_q.filter(
        RopaDocumentModel.deletion_status == DeletionStatusEnum.DELETED
    ).count()

    # 9/10 simplified
    annual_not_reviewed = base_q.filter(
        RopaDocumentModel.status == DocumentStatusEnum.COMPLETED,
        RopaDocumentModel.next_review_due_at <= now,
    ).count()
    annual_reviewed = (
        db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id)))
        .join(
            RopaDocumentModel,
            DocumentReviewCycleModel.document_id == RopaDocumentModel.id,
        )
        .filter(
            RopaDocumentModel.id.in_(doc_ids_q),
            RopaDocumentModel.status == DocumentStatusEnum.COMPLETED,
            DocumentReviewCycleModel.status == ReviewStatusEnum.APPROVED,
            DocumentReviewCycleModel.cycle_number > 1,
        )
        .scalar()
        or 0
    )

    # ── Card 10: เอกสารที่ครบกำหนดทำลาย (รอยื่นคำร้อง) ──────────────────
    # เอกสาร COMPLETED ที่ถึงกำหนดทำลายแล้ว (retention หมดอายุ) และยังไม่ได้ยื่นคำร้องลบ
    destruction_due = 0
    completed_docs = db.query(RopaDocumentModel).options(
        joinedload(RopaDocumentModel.owner_section).load_only(RopaOwnerSectionModel.retention_value, RopaOwnerSectionModel.retention_unit),
        selectinload(RopaDocumentModel.processor_sections).load_only(RopaProcessorSectionModel.retention_value, RopaProcessorSectionModel.retention_unit)
    ).filter(
        RopaDocumentModel.id.in_(doc_ids_q),
        RopaDocumentModel.status == DocumentStatusEnum.COMPLETED,
        RopaDocumentModel.deletion_status.is_(None)
    ).all()
    for d in completed_docs:
        target_sec = d.owner_section or (d.processor_sections[0] if d.processor_sections else None)
        if target_sec and target_sec.retention_value and target_sec.retention_unit and d.last_approved_at:
            rv = target_sec.retention_value
            ru = target_sec.retention_unit.upper()
            dest_date = None
            if ru == "DAYS": dest_date = d.last_approved_at + timedelta(days=rv)
            elif ru == "MONTHS": dest_date = d.last_approved_at + timedelta(days=rv * 30)
            elif ru == "YEARS": dest_date = d.last_approved_at + timedelta(days=rv * 365)
            
            if dest_date:
                if dest_date.tzinfo is None: dest_date = dest_date.replace(tzinfo=timezone.utc)
                if dest_date <= now:
                    destruction_due += 1

    return OwnerDashboardResponse(
        total_documents=total,
        needs_fix_do_count=needs_fix_do,
        needs_fix_dp_count=needs_fix_dp,
        risk_low_count=risk_low,
        risk_medium_count=risk_medium,
        risk_high_count=risk_high,
        under_review_storage_count=under_review_storage,
        under_review_deletion_count=under_review_deletion,
        pending_do_count=pending_do,
        pending_dp_count=pending_dp,
        completed_count=completed,
        sensitive_document_count=sensitive,
        overdue_dp_count=overdue_dp,
        annual_reviewed_count=annual_reviewed,
        annual_not_reviewed_count=annual_not_reviewed,
        destruction_due_count=destruction_due,
        deleted_count=deleted,
    )


def _get_processor_metrics_internal(db: Session, user_id: int):
    total = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.processor_id == user_id)
        .count()
    )
    pending = (
        db.query(ProcessorAssignmentModel)
        .filter(
            ProcessorAssignmentModel.processor_id == user_id,
            ProcessorAssignmentModel.status == "IN_PROGRESS",
        )
        .count()
    )
    completed = (
        db.query(ProcessorAssignmentModel)
        .filter(
            ProcessorAssignmentModel.processor_id == user_id,
            ProcessorAssignmentModel.status == "SUBMITTED",
        )
        .count()
    )
    revisions = (
        db.query(ReviewAssignmentModel)
        .filter(
            ReviewAssignmentModel.user_id == user_id,
            ReviewAssignmentModel.role == "PROCESSOR",
            ReviewAssignmentModel.status == "FIX_IN_PROGRESS",
        )
        .count()
    )
    return ProcessorDashboardResponse(
        total_assigned=total,
        pending_submissions=pending,
        completed_submissions=completed,
        revision_needed=revisions,
    )


def _get_auditor_metrics_internal(db: Session, user_id: int):
    now = datetime.now(timezone.utc)
    total = (
        db.query(AuditorAssignmentModel)
        .filter(AuditorAssignmentModel.auditor_id == user_id)
        .count()
    )
    pending = (
        db.query(AuditorAssignmentModel.id)
        .filter(
            AuditorAssignmentModel.auditor_id == user_id,
            AuditorAssignmentModel.status == "IN_REVIEW",
        )
        .count()
    )
    completed = (
        db.query(AuditorAssignmentModel.id)
        .filter(
            AuditorAssignmentModel.auditor_id == user_id,
            AuditorAssignmentModel.status == "VERIFIED",
        )
        .count()
    )
    overdue = (
        db.query(AuditorAssignmentModel.id)
        .filter(
            AuditorAssignmentModel.auditor_id == user_id,
            AuditorAssignmentModel.status != "VERIFIED",
            AuditorAssignmentModel.due_date < now,
        )
        .count()
    )
    return AuditorDashboardResponse(
        total_assigned=total,
        pending_audits=pending,
        completed_audits=completed,
        overdue_audits=overdue,
    )


def _get_dpo_metrics_internal(db: Session, user_id: int, period: str = "all"):
    now = datetime.now(timezone.utc)
    base_filters = [ReviewDpoAssignmentModel.dpo_id == user_id]
    
    cutoff = None
    if period == "7_days":
        cutoff = now - timedelta(days=7)
    elif period == "30_days":
        cutoff = now - timedelta(days=30)
    elif period == "6_months":
        cutoff = now - timedelta(days=180)
    elif period == "1_year":
        cutoff = now - timedelta(days=365)
    elif period == "this_month":
        cutoff = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        cutoff = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    if cutoff:
        base_filters.append(ReviewDpoAssignmentModel.assigned_at >= cutoff)

    total_assigned = (
        db.query(ReviewDpoAssignmentModel.id)
        .filter(*base_filters)
        .count()
    )

    # 1. Revision Needed
    rev_q = db.query(ReviewFeedbackModel.target_type, func.count(ReviewFeedbackModel.id)).join(
        DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewFeedbackModel.review_cycle_id
    ).join(
        ReviewDpoAssignmentModel, ReviewDpoAssignmentModel.review_cycle_id == DocumentReviewCycleModel.id
    ).filter(
        ReviewDpoAssignmentModel.dpo_id == user_id,
        DocumentReviewCycleModel.status == "CHANGES_REQUESTED",
        ReviewFeedbackModel.status == "OPEN",
    )
    if cutoff:
        rev_q = rev_q.filter(ReviewDpoAssignmentModel.assigned_at >= cutoff)
    rev_needed = rev_q.group_by(ReviewFeedbackModel.target_type).all()

    rev_map = {str(getattr(r[0], "value", r[0])): r[1] for r in rev_needed}

    # 2. Risk Overview
    risk_q = db.query(
        RopaRiskAssessmentModel.risk_level, func.count(RopaRiskAssessmentModel.id)
    ).join(
        RopaDocumentModel, RopaDocumentModel.id == RopaRiskAssessmentModel.document_id
    ).join(
        DocumentReviewCycleModel, DocumentReviewCycleModel.document_id == RopaDocumentModel.id
    ).join(
        ReviewDpoAssignmentModel, ReviewDpoAssignmentModel.review_cycle_id == DocumentReviewCycleModel.id
    ).filter(ReviewDpoAssignmentModel.dpo_id == user_id)
    
    if cutoff:
        risk_q = risk_q.filter(ReviewDpoAssignmentModel.assigned_at >= cutoff)
    
    risks = risk_q.group_by(RopaRiskAssessmentModel.risk_level).all()

    risk_map = {str(getattr(r[0], "value", r[0])): r[1] for r in risks}
    low_risk = risk_map.get("LOW", 0)
    med_risk = risk_map.get("MEDIUM", 0)
    high_risk = risk_map.get("HIGH", 0)

    # 3. For Archiving
    arch_q = db.query(ReviewDpoAssignmentModel.id).join(
        DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewDpoAssignmentModel.review_cycle_id
    ).filter(
        ReviewDpoAssignmentModel.dpo_id == user_id,
        DocumentReviewCycleModel.status == "IN_REVIEW",
    )
    if cutoff:
        arch_q = arch_q.filter(ReviewDpoAssignmentModel.assigned_at >= cutoff)
    for_archiving = arch_q.count()

    # 4. For Destruction
    dest_q = db.query(DocumentDeletionRequestModel.id).filter(
        DocumentDeletionRequestModel.dpo_id == user_id,
        DocumentDeletionRequestModel.status == "PENDING",
    )
    if cutoff:
        dest_q = dest_q.filter(DocumentDeletionRequestModel.requested_at >= cutoff)
    for_destruction = dest_q.count()

    # 5. Auditor Status
    aud_q = db.query(AuditorAssignmentModel.status, func.count(AuditorAssignmentModel.id)).filter(
        AuditorAssignmentModel.assigned_by == user_id
    )
    if cutoff:
        aud_q = aud_q.filter(AuditorAssignmentModel.created_at >= cutoff)
    auditor_tasks = aud_q.group_by(AuditorAssignmentModel.status).all()
    
    aud_status_map = {str(getattr(r[0], "value", r[0])): r[1] for r in auditor_tasks}

    # 6. Approved Total
    app_q = db.query(ReviewDpoAssignmentModel.id).join(
        DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewDpoAssignmentModel.review_cycle_id
    ).filter(
        ReviewDpoAssignmentModel.dpo_id == user_id,
        DocumentReviewCycleModel.status == "APPROVED",
    )
    if cutoff:
        app_q = app_q.filter(ReviewDpoAssignmentModel.assigned_at >= cutoff)
    approved_total = app_q.count()

    # 7. Auditor Delayed
    delay_q = db.query(AuditorAssignmentModel.id).filter(
        AuditorAssignmentModel.assigned_by == user_id,
        AuditorAssignmentModel.status != "VERIFIED",
        AuditorAssignmentModel.due_date < now,
    )
    if cutoff:
        delay_q = delay_q.filter(AuditorAssignmentModel.created_at >= cutoff)
    aud_delayed = delay_q.count()
    return DpoDashboardResponse(
        total_reviewed={"count": total_assigned},
        revision_needed={
            "owner_count": rev_map.get("OWNER_SECTION", 0),
            "processor_count": rev_map.get("PROCESSOR_SECTION", 0),
        },
        risk_overview={
            "total": low_risk + med_risk + high_risk,
            "low": low_risk,
            "medium": med_risk,
            "high": high_risk,
        },
        pending_dpo_review={
            "for_archiving": for_archiving,
            "for_destruction": for_destruction,
        },
        auditor_review_status={
            "pending": aud_status_map.get("IN_REVIEW", 0),
            "completed": aud_status_map.get("VERIFIED", 0),
        },
        approved_documents={"total": approved_total},
        auditor_delayed={"count": aud_delayed},
    )


def _get_executive_metrics_internal(db: Session, period: str = "all"):
    """
    Robust version of Executive metrics calculation
    """
    now = datetime.now(timezone.utc)
    # Standardized period filtering
    base_filters = []
    if period == "7_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=7))
    elif period == "30_days":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=30))
    elif period == "6_months":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=180))
    elif period == "1_year":
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=365))
    elif period == "this_month":
        cutoff = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        base_filters.append(RopaDocumentModel.created_at >= cutoff)
    elif period == "this_year":
        cutoff = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        base_filters.append(RopaDocumentModel.created_at >= cutoff)

    try:
        from app.models.document import RopaRiskAssessmentModel
        from app.models.section_owner import RopaOwnerSectionModel, OwnerDataTypeModel
        from app.models.section_processor import RopaProcessorSectionModel
        from app.models.assignment import ProcessorAssignmentModel
        from app.models.workflow import ReviewFeedbackModel

        all_docs = db.query(RopaDocumentModel).filter(*base_filters).all()

        # ROPA status - more robust aggregation
        draft_count = 0
        pending_count = 0
        under_review_count = 0
        completed_count = 0

        for doc in all_docs:
            try:
                owner_sec = (
                    db.query(RopaOwnerSectionModel)
                    .filter(RopaOwnerSectionModel.document_id == doc.id)
                    .first()
                )
                proc_sec = (
                    db.query(RopaProcessorSectionModel)
                    .filter(RopaProcessorSectionModel.document_id == doc.id)
                    .first()
                )

                if (owner_sec and owner_sec.status == RopaSectionEnum.DRAFT) or (
                    proc_sec and proc_sec.status == RopaSectionEnum.DRAFT
                ):
                    draft_count += 1
                    continue

                target_ids = [s.id for s in [owner_sec, proc_sec] if s]
                has_open_feedback = False
                if target_ids:
                    has_open_feedback = (
                        db.query(ReviewFeedbackModel)
                        .filter(
                            ReviewFeedbackModel.target_id.in_(target_ids),
                            ReviewFeedbackModel.status == FeedbackStatusEnum.OPEN,
                        )
                        .first()
                        is not None
                    )

                if has_open_feedback:
                    pending_count += 1
                    continue

                if doc.status == DocumentStatusEnum.UNDER_REVIEW:
                    under_review_count += 1
                    continue

                proc_assignment = (
                    db.query(ProcessorAssignmentModel)
                    .filter(
                        ProcessorAssignmentModel.document_id == doc.id,
                        ProcessorAssignmentModel.status
                        == AssignmentStatusEnum.SUBMITTED,
                    )
                    .first()
                )
                if proc_assignment and doc.status == DocumentStatusEnum.IN_PROGRESS:
                    under_review_count += 1
                    continue

                if doc.status == DocumentStatusEnum.COMPLETED:
                    completed_count += 1
                elif (
                    owner_sec
                    and owner_sec.status == RopaSectionEnum.SUBMITTED
                    and proc_sec
                    and proc_sec.status == RopaSectionEnum.SUBMITTED
                ):
                    completed_count += 1
            except Exception:
                continue  # Skip individual doc errors to keep aggregation going

        ropa_status = RopaStatusOverview(
            draft=draft_count,
            pending=pending_count,
            under_review=under_review_count,
            completed=completed_count,
            total=len(all_docs),
        )

        # Risk by department - filter by base_filters
        dept_rows = (
            db.query(
                UserModel.department,
                RopaRiskAssessmentModel.risk_level,
                func.count(RopaRiskAssessmentModel.id).label("cnt"),
            )
            .select_from(RopaDocumentModel)
            .join(
                RopaOwnerSectionModel,
                RopaOwnerSectionModel.document_id == RopaDocumentModel.id,
            )
            .join(UserModel, UserModel.id == RopaOwnerSectionModel.owner_id)
            .join(
                RopaRiskAssessmentModel,
                RopaRiskAssessmentModel.document_id == RopaDocumentModel.id,
            )
            .filter(UserModel.department.isnot(None), *base_filters)
            .group_by(UserModel.department, RopaRiskAssessmentModel.risk_level)
            .all()
        )

        risk_map: dict = {}
        for dept, risk_level, cnt in dept_rows:
            if dept not in risk_map:
                risk_map[dept] = {"low": 0, "medium": 0, "high": 0}
            rl_str = str(getattr(risk_level, "value", risk_level)).upper()
            if rl_str == "LOW":
                risk_map[dept]["low"] += cnt
            elif rl_str == "MEDIUM":
                risk_map[dept]["medium"] += cnt
            elif rl_str == "HIGH":
                risk_map[dept]["high"] += cnt

        risk_by_dept = [
            RiskByDepartment(
                department=dept,
                low=v["low"],
                medium=v["medium"],
                high=v["high"],
                total=v["low"] + v["medium"] + v["high"],
            )
            for dept, v in risk_map.items()
        ]

        # Sensitive docs by department - filter by base_filters
        sensitive_rows = (
            db.query(
                UserModel.department,
                func.count(func.distinct(RopaDocumentModel.id)).label("cnt"),
            )
            .select_from(RopaDocumentModel)
            .join(
                RopaOwnerSectionModel,
                RopaOwnerSectionModel.document_id == RopaDocumentModel.id,
            )
            .join(UserModel, UserModel.id == RopaOwnerSectionModel.owner_id)
            .join(
                OwnerDataTypeModel,
                OwnerDataTypeModel.owner_section_id == RopaOwnerSectionModel.id,
            )
            .filter(
                UserModel.department.isnot(None),
                func.lower(OwnerDataTypeModel.type) == "sensitive",
                *base_filters
            )
            .group_by(UserModel.department)
            .all()
        )
        sensitive_by_dept = [
            SensitiveDocByDepartment(department=dept, count=cnt)
            for dept, cnt in sensitive_rows
        ]

        # Other global counters - filter by base_filters
        pending_do = (
            db.query(func.count(RopaOwnerSectionModel.id))
            .join(RopaDocumentModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
            .filter(RopaOwnerSectionModel.status == RopaSectionEnum.DRAFT, *base_filters)
            .scalar()
            or 0
        )
        pending_dp = (
            db.query(func.count(RopaProcessorSectionModel.id))
            .join(RopaDocumentModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
            .filter(RopaProcessorSectionModel.status == RopaSectionEnum.DRAFT, *base_filters)
            .scalar()
            or 0
        )
        approved_total = (
            db.query(func.count(RopaDocumentModel.id))
            .filter(RopaDocumentModel.status == DocumentStatusEnum.COMPLETED, *base_filters)
            .scalar()
            or 0
        )
        for_archiving = (
            db.query(func.count(RopaDocumentModel.id))
            .filter(
                RopaDocumentModel.status == DocumentStatusEnum.UNDER_REVIEW,
                RopaDocumentModel.deletion_status.is_(None),
                *base_filters
            )
            .scalar()
            or 0
        )
        for_destruction = (
            db.query(func.count(RopaDocumentModel.id))
            .filter(
                RopaDocumentModel.deletion_status == DeletionStatusEnum.DELETE_PENDING,
                *base_filters
            )
            .scalar()
            or 0
        )

        # 7. Final Department List (from Master Data)
        all_depts = (
            db.query(MstDepartmentModel.name)
            .filter(MstDepartmentModel.is_active == True)
            .all()
        )
        available_depts = [d[0] for d in all_depts]

        return ExecutiveDashboardResponse(
            selected_period=period,
            ropa_status_overview=ropa_status,
            risk_by_department=risk_by_dept,
            sensitive_docs_by_department=sensitive_by_dept,
            pending_documents=PendingDocuments(
                data_owner_count=pending_do, data_processor_count=pending_dp
            ),
            approved_documents=ApprovedDocumentsSummary(total=approved_total),
            pending_dpo_review=PendingDpoReviewSummary(
                for_archiving=for_archiving, for_destruction=for_destruction
            ),
            available_departments=available_depts,
        )
    except Exception as e:
        print(f"Error in _get_executive_metrics: {str(e)}")
        # Default empty response
        return ExecutiveDashboardResponse(
            selected_period="all",
            ropa_status_overview=RopaStatusOverview(
                draft=0, pending=0, under_review=0, completed=0, total=0
            ),
            risk_by_department=[],
            sensitive_docs_by_department=[],
            pending_documents=PendingDocuments(
                data_owner_count=0, data_processor_count=0
            ),
            approved_documents=ApprovedDocumentsSummary(total=0),
            pending_dpo_review=PendingDpoReviewSummary(
                for_archiving=0, for_destruction=0
            ),
            available_departments=[],
        )


# --- Endpoints ---


@router.get(
    "/dashboard/owner",
    response_model=OwnerDashboardResponse,
    summary="Owner: Dashboard",
    tags=["Dashboard (Owner)"],
)
def owner_dashboard(
    period: str = Query(
        "all", description="Filter period: weekly, monthly, 6months, yearly, all"
    ),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    return _get_owner_metrics_internal(db, current_user.id, period)


@router.get(
    "/dashboard/processor",
    response_model=ProcessorDashboardResponse,
    summary="Processor: Dashboard",
    tags=["Dashboard (Processor)"],
)
def processor_dashboard(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    return _get_processor_metrics_internal(db, current_user.id)


@router.get(
    "/dashboard/auditor",
    response_model=AuditorDashboardResponse,
    summary="Auditor: Dashboard",
    tags=["Dashboard (Auditor)"],
)
def auditor_dashboard(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.AUDITOR)),
):
    return _get_auditor_metrics_internal(db, current_user.id)


@router.get(
    "/dashboard/dpo",
    response_model=DpoDashboardResponse,
    summary="DPO: Dashboard",
    tags=["Dashboard (DPO)"],
)
def dpo_dashboard(
    period: str = Query("all", description="Filter period: 7_days, 30_days, 6_months, 1_year, all"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    return _get_dpo_metrics_internal(db, current_user.id, period)


@router.get(
    "/dashboard/users",
    response_model=AdminUserDashboardResponse,
    summary="Admin: User Statistics Dashboard",
    tags=["Dashboard (Admin)"],
)
def user_stats_dashboard(
    period: str = Query(
        "30_days", description="Filter period: 7_days, 30_days, 6_months, 1_year, overdue, custom"
    ),
    custom_date: Optional[str] = Query(
        None, description="Format YYYY-MM-DD. Required if period=custom"
    ),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    now = datetime.now(timezone.utc)
    base_filters = []

    if period == "7_days":
        base_filters.append(UserModel.created_at >= now - timedelta(days=7))
    elif period == "30_days":
        base_filters.append(UserModel.created_at >= now - timedelta(days=30))
    elif period == "6_months":
        base_filters.append(UserModel.created_at >= now - timedelta(days=180))
    elif period == "1_year":
        base_filters.append(UserModel.created_at >= now - timedelta(days=365))
    elif period == "custom":
        if not custom_date:
            raise HTTPException(
                status_code=400, detail="custom_date is required when period is custom"
            )
        try:
            c_date = datetime.strptime(custom_date, "%Y-%m-%d").date()
            base_filters.append(cast(UserModel.created_at, Date) == c_date)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid custom_date format. Use YYYY-MM-DD"
            )
    # 'overdue' has no meaning for users → treat as ALL (no filter)

    # ── 1. User Overview (center donut) ──────────────────────────────────────
    role_counts = (
        db.query(UserModel.role, func.count(UserModel.id).label("count"))
        .filter(*base_filters, UserModel.status == "ACTIVE")
        .group_by(UserModel.role)
        .all()
    )

    roles_map = {
        "OWNER": 0,
        "PROCESSOR": 0,
        "DPO": 0,
        "AUDITOR": 0,
        "ADMIN": 0,
        "EXECUTIVE": 0,
    }
    for r in role_counts:
        role_key = str(getattr(r.role, "value", r.role))
        roles_map[role_key] = r.count

    total_users = sum(roles_map.values())

    # ── Helper: group by department for a given role ──────────────────────────
    def by_department(role_value: str):
        rows = (
            db.query(UserModel.department, func.count(UserModel.id).label("count"))
            .filter(
                *base_filters,
                UserModel.role == role_value,
                UserModel.status == "ACTIVE",
                UserModel.department.isnot(None),
            )
            .group_by(UserModel.department)
            .all()
        )
        return [
            {"department": f"แผนกที่ {i+1} [{r.department or 'ไม่ระบุ'}]", "count": r.count}
            for i, r in enumerate(rows)
        ]

    def by_company(role_value: str):
        rows = (
            db.query(UserModel.company_name, func.count(UserModel.id).label("count"))
            .filter(
                *base_filters,
                UserModel.role == role_value,
                UserModel.status == "ACTIVE",
                UserModel.company_name.isnot(None),
            )
            .group_by(UserModel.company_name)
            .all()
        )
        return [
            {"company": f"บริษัทที่ {i+1} [{r.company_name or 'ไม่ระบุ'}]", "count": r.count}
            for i, r in enumerate(rows)
        ]

    # ── 2. Role Breakdowns ────────────────────────────────────────────────────
    owner_by_dept = by_department("OWNER")
    dpo_by_dept = by_department("DPO")
    admin_by_dept = by_department("ADMIN")
    exec_by_dept = by_department("EXECUTIVE")
    proc_by_co = by_company("PROCESSOR")

    # Auditor: Internal → dept, External → company
    aud_internal_rows = (
        db.query(UserModel.department, func.count(UserModel.id).label("count"))
        .filter(
            *base_filters,
            UserModel.role == "AUDITOR",
            UserModel.auditor_type == "INTERNAL",
            UserModel.status == "ACTIVE",
        )
        .group_by(UserModel.department)
        .all()
    )

    aud_external_rows = (
        db.query(UserModel.company_name, func.count(UserModel.id).label("count"))
        .filter(
            *base_filters,
            UserModel.role == "AUDITOR",
            UserModel.auditor_type == "EXTERNAL",
            UserModel.status == "ACTIVE",
        )
        .group_by(UserModel.company_name)
        .all()
    )

    aud_internal_total = sum(r.count for r in aud_internal_rows)
    aud_external_total = sum(r.count for r in aud_external_rows)

    return AdminUserDashboardResponse(
        selected_period=period,
        user_overview={"total": total_users, "roles": roles_map},
        role_breakdowns={
            "owner_breakdown": {"by_department": owner_by_dept},
            "processor_breakdown": {"by_company": proc_by_co},
            "dpo_breakdown": {"by_department": dpo_by_dept},
            "auditor_breakdown": {
                "internal": {
                    "by_department": [
                        {
                            "department": f"แผนกที่ {i+1} [{r.department or 'ไม่ระบุ'}]",
                            "count": r.count,
                        }
                        for i, r in enumerate(aud_internal_rows)
                    ]
                },
                "external": {
                    "by_company": [
                        {
                            "company": f"บริษัทที่ {i+1} [{r.company_name or 'ไม่ระบุ'}]",
                            "count": r.count,
                        }
                        for i, r in enumerate(aud_external_rows)
                    ]
                },
            },
            "admin_breakdown": {"by_department": admin_by_dept},
            "executive_breakdown": {"by_department": exec_by_dept},
        },
    )


@router.get(
    "/dashboard/dpo/documents",
    response_model=PaginatedDpoDocumentTableResponse,
    summary="DPO: Document List Table",
    tags=["Dashboard (DPO)"],
)
def list_dpo_documents(
    status_filter: Optional[str] = Query(None, description="Filter logic by status"),
    period: str = Query("all", description="Filter period: 7_days, 30_days, 6_months, 1_year, all"),
    search: Optional[str] = Query(
        None, description="Search by title or document number"
    ),
    days_filter: Optional[int] = Query(None, description="Filter by number of days (frontend legacy)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO, Role.AUDITOR)),
):
    # Handle days_filter from frontend
    if days_filter is not None and period == "all":
        if days_filter == 7:
            period = "7_days"
        elif days_filter == 30:
            period = "30_days"

    # CTE to compute sequence number (RP-YYYY-XX)
    doc_seq_subquery = db.query(
        RopaDocumentModel.id.label("doc_id"),
        func.extract("year", RopaDocumentModel.created_at).label("doc_year"),
        func.row_number()
        .over(
            partition_by=func.extract("year", RopaDocumentModel.created_at),
            order_by=RopaDocumentModel.created_at,
        )
        .label("doc_number"),
    ).subquery()

    query = (
        db.query(
            RopaDocumentModel,
            DocumentReviewCycleModel,
            UserModel,
            doc_seq_subquery.c.doc_year,
            doc_seq_subquery.c.doc_number,
        )
        .select_from(RopaDocumentModel)
        .join(
            DocumentReviewCycleModel,
            RopaDocumentModel.id == DocumentReviewCycleModel.document_id,
        )
        .join(UserModel, RopaDocumentModel.created_by == UserModel.id)
        .join(doc_seq_subquery, RopaDocumentModel.id == doc_seq_subquery.c.doc_id)
    )

    assigned_at_col = None

    if current_user.role == Role.DPO:
        query = query.join(
            ReviewDpoAssignmentModel,
            DocumentReviewCycleModel.id == ReviewDpoAssignmentModel.review_cycle_id,
        ).add_entity(ReviewDpoAssignmentModel).filter(ReviewDpoAssignmentModel.dpo_id == current_user.id)
        assigned_at_col = ReviewDpoAssignmentModel.assigned_at
    else:
        # Auditor Role
        query = query.join(
            AuditorAssignmentModel,
            RopaDocumentModel.id == AuditorAssignmentModel.document_id,
        ).add_entity(AuditorAssignmentModel).filter(AuditorAssignmentModel.auditor_id == current_user.id)
        assigned_at_col = AuditorAssignmentModel.created_at

    # Standardized period filtering
    now = datetime.now(timezone.utc)
    cutoff_date = None
    if period == "7_days":
        cutoff_date = now - timedelta(days=7)
    elif period == "30_days":
        cutoff_date = now - timedelta(days=30)
    elif period == "6_months":
        cutoff_date = now - timedelta(days=180)
    elif period == "1_year":
        cutoff_date = now - timedelta(days=365)
    elif period == "this_month":
        cutoff_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        cutoff_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    if cutoff_date and assigned_at_col is not None:
        query = query.filter(assigned_at_col >= cutoff_date)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                RopaDocumentModel.title.ilike(search_term),
                RopaDocumentModel.document_number.ilike(search_term),
            )
        )

    if status_filter:
        s_filter = status_filter.lower()
        if "รอ" in s_filter or s_filter == "pending" or s_filter == "in_review":
            query = query.filter(DocumentReviewCycleModel.status == "IN_REVIEW")
        elif "แก้ไข" in s_filter or "action_required" in s_filter or s_filter == "changes_requested":
            query = query.filter(DocumentReviewCycleModel.status == "CHANGES_REQUESTED")
        elif "เสร็จสิ้น" in s_filter or s_filter == "completed" or s_filter == "approved":
            query = query.filter(DocumentReviewCycleModel.status == "APPROVED")
        # Additional manual status filters can go here

    total = query.count()
    results = (
        query.order_by(assigned_at_col.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []

    for row in results:
        doc = row.RopaDocumentModel
        cycle = row.DocumentReviewCycleModel
        user = row.UserModel
        doc_year = int(row.doc_year)
        doc_number = int(row.doc_number)

        # Get assignment-specific data
        if current_user.role == Role.DPO:
            assignment = row.ReviewDpoAssignmentModel
            assigned_at = assignment.assigned_at
        else:
            assignment = row.AuditorAssignmentModel
            assigned_at = assignment.created_at

        doc_code = f"RP-{doc_year}-{doc_number:02d}"
        display_title = f"{doc_code} {doc.title or 'ไม่มีชื่อเอกสาร'}"

        full_name = filter(None, [user.title, user.first_name, user.last_name])
        data_owner_name = " ".join(full_name) or "ไม่ระบุ"

        owner_sec = (
            db.query(RopaOwnerSectionModel)
            .filter(RopaOwnerSectionModel.document_id == doc.id)
            .first()
        )
        proc_sec = (
            db.query(RopaProcessorSectionModel)
            .filter(RopaProcessorSectionModel.document_id == doc.id)
            .first()
        )

        owner_completed = bool(
            owner_sec
            and getattr(owner_sec.status, "value", owner_sec.status) == "SUBMITTED"
        )
        processor_completed = bool(
            proc_sec
            and getattr(proc_sec.status, "value", proc_sec.status) == "SUBMITTED"
        )

        status_enum_val = str(getattr(cycle.status, "value", cycle.status))
        reviewed_dt = cycle.reviewed_at if status_enum_val != "IN_REVIEW" else None

        # Determine owner_status and processor_status based on DPO comments
        owner_status = None
        processor_status = None
        
        if status_enum_val == "CHANGES_REQUESTED":
            # Check for DO comments (starts with DO_ or is risk/DO_RISK)
            has_do_comments = db.query(exists().where(
                and_(
                    DpoSectionCommentModel.document_id == doc.id,
                    or_(
                        DpoSectionCommentModel.section_key.like("DO_%"),
                        DpoSectionCommentModel.section_key == "risk",
                        DpoSectionCommentModel.section_key == "DO_RISK"
                    )
                )
            )).scalar()
            
            # Check for DP comments (starts with DP_)
            has_dp_comments = db.query(exists().where(
                and_(
                    DpoSectionCommentModel.document_id == doc.id,
                    DpoSectionCommentModel.section_key.like("DP_%")
                )
            )).scalar()
            
            if has_do_comments:
                owner_status = "edit"
            if has_dp_comments:
                processor_status = "edit"

        items.append(
            DpoDocumentTableItem(
                document_id=doc_code,
                raw_document_id=doc.id,
                title=display_title,
                data_owner_name=data_owner_name,
                assigned_at=assigned_at,
                reviewed_at=reviewed_dt,
                status_flags=DocumentStatusFlags(
                    owner_completed=owner_completed,
                    processor_completed=processor_completed,
                ),
                review_status=status_enum_val,
                owner_status=owner_status,
                processor_status=processor_status,
            )
        )

    return PaginatedDpoDocumentTableResponse(
        total=total, page=page, limit=limit, items=items
    )


@router.get(
    "/dashboard/dpo/destruction-requests",
    response_model=PaginatedDpoDestructionTableResponse,
    summary="DPO: Destruction Requests Table",
    tags=["Dashboard (DPO)"],
)
def list_dpo_destruction_requests(
    status_filter: Optional[str] = Query(None, description="Filter logic by status"),
    period: str = Query("all", description="Filter period: 7_days, 30_days, 6_months, 1_year, all"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    # CTE to compute sequence number (RP-YYYY-XX) based on the original document created_at
    doc_seq_subquery = db.query(
        RopaDocumentModel.id.label("doc_id"),
        func.extract("year", RopaDocumentModel.created_at).label("doc_year"),
        func.row_number()
        .over(
            partition_by=func.extract("year", RopaDocumentModel.created_at),
            order_by=RopaDocumentModel.created_at,
        )
        .label("doc_number"),
    ).subquery()

    query = (
        db.query(
            DocumentDeletionRequestModel,
            RopaDocumentModel,
            UserModel,
            doc_seq_subquery.c.doc_year,
            doc_seq_subquery.c.doc_number,
        )
        .join(
            RopaDocumentModel,
            DocumentDeletionRequestModel.document_id == RopaDocumentModel.id,
        )
        .join(UserModel, DocumentDeletionRequestModel.requested_by == UserModel.id)
        .join(doc_seq_subquery, RopaDocumentModel.id == doc_seq_subquery.c.doc_id)
        .filter(DocumentDeletionRequestModel.dpo_id == current_user.id)
    )

    # Standardized period filtering
    now = datetime.now(timezone.utc)
    cutoff_date = None
    if period == "7_days":
        cutoff_date = now - timedelta(days=7)
    elif period == "30_days":
        cutoff_date = now - timedelta(days=30)
    elif period == "6_months":
        cutoff_date = now - timedelta(days=180)
    elif period == "1_year":
        cutoff_date = now - timedelta(days=365)
    elif period == "this_month":
        cutoff_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        cutoff_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    if cutoff_date:
        query = query.filter(DocumentDeletionRequestModel.requested_at >= cutoff_date)

    if status_filter:
        s_filter = status_filter.lower()
        if "รอ" in s_filter or s_filter == "pending":
            query = query.filter(DocumentDeletionRequestModel.status == "PENDING")
        elif "ไม่อนุมัติ" in s_filter or s_filter == "rejected":
            query = query.filter(DocumentDeletionRequestModel.status == "REJECTED")
        elif "อนุมัติ" in s_filter or s_filter == "approved":
            query = query.filter(DocumentDeletionRequestModel.status == "APPROVED")

    total = query.count()
    results = (
        query.order_by(DocumentDeletionRequestModel.requested_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []

    ui_status_map = {
        "PENDING": "รอตรวจสอบทำลาย",
        "REJECTED": "ไม่อนุมัติการทำลาย",
        "APPROVED": "อนุมัติการทำลาย",
    }

    for row in results:
        req = row.DocumentDeletionRequestModel
        doc = row.RopaDocumentModel
        user = row.UserModel
        doc_year = int(row.doc_year)
        doc_number = int(row.doc_number)

        doc_code = f"RP-{doc_year}-{doc_number:02d}"
        display_title = f"{doc_code} {doc.title or 'ไม่มีชื่อเอกสาร'}"

        full_name = filter(None, [user.title, user.first_name, user.last_name])
        data_owner_name = " ".join(full_name) or "ไม่ระบุ"

        status_enum_val = str(getattr(req.status, "value", req.status))
        items.append(
            DpoDestructionTableItem(
                request_id=str(req.id),
                raw_document_id=doc.id,
                document_id=doc_code,
                name=doc.title or "ไม่มีชื่อเอกสาร",
                owner=data_owner_name,
                received_date=req.requested_at,
                destruction_date=req.decided_at,
                status=status_enum_val,
            )
        )

    return PaginatedDpoDestructionTableResponse(
        total=total, page=page, limit=limit, items=items
    )


@router.patch(
    "/dashboard/dpo/destruction-requests/{document_id}",
    summary="DPO: Approve or Reject Destruction Request",
    tags=["Dashboard (DPO)"],
)
def review_destruction_request(
    document_id: UUID,
    payload: DpoDestructionReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    # 1. Find the request
    req = (
        db.query(DocumentDeletionRequestModel)
        .filter(
            DocumentDeletionRequestModel.document_id == document_id,
            DocumentDeletionRequestModel.dpo_id == current_user.id,
            DocumentDeletionRequestModel.status == "PENDING",
        )
        .first()
    )

    if not req:
        raise HTTPException(
            status_code=404, detail="คำขอทำลายไม่พบ หรือไม่ได้อยู่ในสถานะที่รอดำเนินการ"
        )

    # 2. Update request
    req.status = payload.status
    req.dpo_reason = payload.rejection_reason
    req.decided_at = datetime.now(timezone.utc)
    # req.dpo_decision is used in model, map it too
    req.dpo_decision = payload.status

    # 3. Update document status
    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if payload.status == "APPROVED":
        doc.deletion_status = "DELETED"
        doc.deleted_at = datetime.now(timezone.utc)
    else:
        # If REJECTED, reset deletion_status to None so DO can request again
        doc.deletion_status = None

    db.commit()
    return {"message": "บันทึกผลการตรวจสอบคำขอทำลายเรียบร้อยแล้ว"}


@router.get(
    "/dashboard/dpo/auditor-assignments",
    response_model=PaginatedDpoAuditorAssignmentTableResponse,
    summary="DPO: Auditor Assignments Table",
    tags=["Dashboard (DPO)"],
)
def list_dpo_auditor_assignments(
    status_filter: Optional[str] = Query(None, description="Filter logic by status"),
    period: str = Query("all", description="Filter period: 7_days, 30_days, 6_months, 1_year, all"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    # CTE to compute sequence number (RP-YYYY-XX) based on the original document created_at
    doc_seq_subquery = db.query(
        RopaDocumentModel.id.label("doc_id"),
        func.extract("year", RopaDocumentModel.created_at).label("doc_year"),
        func.row_number()
        .over(
            partition_by=func.extract("year", RopaDocumentModel.created_at),
            order_by=RopaDocumentModel.created_at,
        )
        .label("doc_number"),
    ).subquery()

    query = (
        db.query(
            AuditorAssignmentModel,
            RopaDocumentModel,
            UserModel,
            doc_seq_subquery.c.doc_year,
            doc_seq_subquery.c.doc_number,
        )
        .join(
            RopaDocumentModel,
            AuditorAssignmentModel.document_id == RopaDocumentModel.id,
        )
        .join(UserModel, AuditorAssignmentModel.auditor_id == UserModel.id)
        .join(doc_seq_subquery, RopaDocumentModel.id == doc_seq_subquery.c.doc_id)
        .filter(AuditorAssignmentModel.assigned_by == current_user.id)
    )

    # Standardized period filtering
    now = datetime.now(timezone.utc)
    cutoff_date = None
    if period == "7_days":
        cutoff_date = now - timedelta(days=7)
    elif period == "30_days":
        cutoff_date = now - timedelta(days=30)
    elif period == "6_months":
        cutoff_date = now - timedelta(days=180)
    elif period == "1_year":
        cutoff_date = now - timedelta(days=365)
    elif period == "this_month":
        cutoff_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        cutoff_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    if cutoff_date:
        query = query.filter(AuditorAssignmentModel.created_at >= cutoff_date)

    if status_filter:
        s_filter = status_filter.lower()
        if "รอ" in s_filter or s_filter == "pending":
            query = query.filter(AuditorAssignmentModel.status == "IN_REVIEW")
        elif "เสร็จสิ้น" in s_filter or s_filter == "completed":
            query = query.filter(AuditorAssignmentModel.status == "VERIFIED")

    total = query.count()
    # Order by creation date (assignment date) as requested
    results = (
        query.order_by(AuditorAssignmentModel.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []

    for row in results:
        assign = row.AuditorAssignmentModel
        doc = row.RopaDocumentModel
        user = row.UserModel
        doc_year = int(row.doc_year)
        doc_number = int(row.doc_number)

        doc_code = f"RP-{doc_year}-{doc_number:02d}"
        display_title = f"{doc_code} {doc.title or 'ไม่มีชื่อเอกสาร'}"

        full_name = filter(None, [user.title, user.first_name, user.last_name])
        auditor_name = " ".join(full_name) or "ไม่ระบุ"

        status_enum_val = str(getattr(assign.status, "value", assign.status))

        # Assumption: reviewed_at is assignment status completion or cycle end.
        # For simplicity and based on mockup, we show completion date if status is COMPLETED.
        reviewed_at = None
        if status_enum_val == "COMPLETED":
            # We can use updated_at if available in model, but AuditorAssignmentModel doesn't have it.
            # I'll use assigned_at + due_date for now or just None if not tracked.
            # Actually, I'll return None for now unless I find a better place.
            pass

        items.append(
            DpoAuditorAssignmentTableItem(
                assignment_id=str(assign.id),
                document_id=doc_code,
                title=display_title,
                auditor_name=auditor_name,
                assigned_at=assign.created_at,
                reviewed_at=reviewed_at,
                review_status=status_enum_val,
            )
        )

    return PaginatedDpoAuditorAssignmentTableResponse(
        total=total, page=page, limit=limit, items=items
    )


@router.get(
    "/dashboard/dpo/documents/{document_id}/comments",
    response_model=List[DpoCommentRead],
    summary="DPO: Get Document Comments",
    tags=["Dashboard (DPO)"],
)
def get_document_comments(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO, Role.AUDITOR)),
):
    check_document_access(document_id, current_user, db)
    comments = (
        db.query(DpoSectionCommentModel)
        .filter(DpoSectionCommentModel.document_id == document_id)
        .all()
    )
    return comments


@router.post(
    "/dashboard/dpo/documents/{document_id}/comments",
    summary="DPO: Save Document Comments (Bulk by Group)",
    tags=["Dashboard (DPO)"],
)
def save_document_comments(
    document_id: UUID,
    payload: DpoCommentBulkRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    check_document_access(document_id, current_user, db)

    group = payload.group.upper()

    # Determine if the submission results in Approval or Changes Requested
    # Logic: If all comments are empty or whitespace-only -> APPROVED
    # Otherwise -> CHANGES_REQUESTED
    is_approved = True
    for item in payload.comments:
        c_text = (item.comment or "").strip()
        if c_text:
            is_approved = False
            break

    # "ทับไปเลย" (Overwrite) inside the group
    # We delete existing comments for this group in this document
    if group == "DO":
        # Handles both DO_SEC_1..7, DO_RISK and new numeric IDs
        db.query(DpoSectionCommentModel).filter(
            DpoSectionCommentModel.document_id == document_id,
            or_(
                DpoSectionCommentModel.section_key.like("DO_%"),
                DpoSectionCommentModel.section_key == "risk",
                DpoSectionCommentModel.section_key.in_(["1", "2", "3", "4", "5", "6", "7"])
            ),
        ).delete(synchronize_session=False)
    else:
        # Handles DP_SEC_1..6 and new numeric IDs
        db.query(DpoSectionCommentModel).filter(
            DpoSectionCommentModel.document_id == document_id,
            or_(
                DpoSectionCommentModel.section_key.like(f"{group}_%"),
                DpoSectionCommentModel.section_key.in_(["1", "2", "3", "4", "5", "6"])
            ),
        ).delete(synchronize_session=False)

    # Insert new comments
    for item in payload.comments:
        if not item.comment or not item.comment.strip():
            continue

        new_comment = DpoSectionCommentModel(
            document_id=document_id,
            section_key=item.section_key,
            comment=item.comment,
            created_by=current_user.id,
        )
        db.add(new_comment)

    # Update Cycle Status and Date ONLY if is_final is True
    cycle = (
        db.query(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id == document_id,
            DocumentReviewCycleModel.status == "IN_REVIEW",
        )
        .order_by(DocumentReviewCycleModel.requested_at.desc())
        .first()
    )

    now = datetime.now(timezone.utc)

    if cycle and payload.is_final:
        # Check if there are ANY comments in the database for this document (across all groups)
        db.flush() # Ensure current batch comments are visible to the query
        existing_comments_count = db.query(DpoSectionCommentModel).filter(DpoSectionCommentModel.document_id == document_id).count()
        
        has_any_feedback = existing_comments_count > 0
        
        # Determine final status:
        # If there's any feedback in the DB, it MUST be CHANGES_REQUESTED
        if has_any_feedback:
            target_status = "CHANGES_REQUESTED"
        elif payload.status == "REJECTED": # Explicit override
            target_status = "CHANGES_REQUESTED"
        else:
            target_status = "APPROVED"

        cycle.status = target_status
        cycle.reviewed_at = now
        cycle.reviewed_by = current_user.id
        db.add(cycle)

        # If the review cycle is APPROVED, update the main Document status
        doc = (
            db.query(RopaDocumentModel)
            .filter(RopaDocumentModel.id == document_id)
            .first()
        )
        if doc:
            if cycle.status == "APPROVED":
                # Check if there's any active auditor assignment
                has_auditor = db.query(exists().where(
                    and_(
                        AuditorAssignmentModel.document_id == document_id,
                        AuditorAssignmentModel.status != "VERIFIED"
                    )
                )).scalar()
                
                if has_auditor:
                    # Keep it as UNDER_REVIEW if an auditor is assigned
                    doc.status = "UNDER_REVIEW"
                else:
                    doc.status = "COMPLETED"
                    doc.last_approved_at = now
                    # Calculate next review due date
                    interval = doc.review_interval_days or 365
                    doc.next_review_due_at = now + timedelta(days=interval)

                    # Transform document_number prefix from DFT- to RP-
                    if doc.document_number and doc.document_number.startswith("DFT-"):
                        doc.document_number = doc.document_number.replace("DFT-", "RP-", 1)
            else:
                # CHANGES_REQUESTED -> Move back to Table 1 (Active/Processing)
                doc.status = "IN_PROGRESS"
                
                # ALSO reset the specific section status to DRAFT so they can edit
                if group == "DO":
                    owner_sec = db.query(RopaOwnerSectionModel).filter(RopaOwnerSectionModel.document_id == document_id).first()
                    if owner_sec:
                        owner_sec.status = "DRAFT"
                        db.add(owner_sec)
                elif group == "DP":
                    proc_sec = db.query(RopaProcessorSectionModel).filter(RopaProcessorSectionModel.document_id == document_id).first()
                    if proc_sec:
                        proc_sec.status = "DRAFT"
                        # proc_sec.is_sent = False # Keep is_sent so DO can see feedback
                        db.add(proc_sec)

            db.add(doc)

    db.commit()

    determined_status = "PENDING (DRAFT)"
    if payload.is_final:
        determined_status = (
            "APPROVED" if is_approved else "NOT_APPROVED (CHANGES_REQUESTED)"
        )

    return {
        "message": f"Comments for {payload.group} saved successfully.",
        "is_final": payload.is_final,
        "determined_status": determined_status,
        "reviewed_at": cycle.reviewed_at if cycle and payload.is_final else None,
    }


@router.get(
    "/dashboard/documents-from-dpo",
    response_model=PaginatedOwnerDpoReviewedDocumentResponse,
    summary="Shared: Documents Received from DPO",
    tags=["Dashboard (Shared)"],
)
def list_documents_from_dpo(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    status: Optional[str] = Query(
        None,
        description="FILTER: IN_REVIEW, ACTION_REQUIRED_DO, ACTION_REQUIRED_DP, COMPLETED",
    ),
    search: Optional[str] = Query(None, description="Search by title or doc number"),
    date_range: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    """
    Returns a unified list of documents in the DPO review cycle.
    Visibility rules:
    - DO: Sees docs they own. Sees ALL feedback.
    - DP: Sees docs they are assigned to. Sees DP-ONLY feedback.
    - Auditor: Sees docs where status is APPROVED.
    """
    from sqlalchemy import text, and_, or_, exists

    now = datetime.now(timezone.utc)
    role = current_user.role
    user_id = current_user.id

    # 1. Access Control Base Filter
    if role == Role.ADMIN:
        access_filter = text("1=1")
    elif role == Role.OWNER:
        # Owner or Creator
        access_filter = or_(
            RopaDocumentModel.created_by == user_id,
            db.query(ProcessorAssignmentModel.id)
            .filter(
                ProcessorAssignmentModel.document_id == RopaDocumentModel.id,
                ProcessorAssignmentModel.assigned_by == user_id,
            )
            .exists(),
        )
    elif role == Role.PROCESSOR:
        # Only where they are the processor
        access_filter = (
            db.query(ProcessorAssignmentModel.id)
            .filter(
                ProcessorAssignmentModel.document_id == RopaDocumentModel.id,
                ProcessorAssignmentModel.processor_id == user_id,
            )
            .exists()
        )
    elif role == Role.AUDITOR:
        # Use an alias to avoid correlation issues with the main query join
        AA = aliased(AuditorAssignmentModel)
        access_filter = exists().where(
            and_(
                AA.document_id == RopaDocumentModel.id,
                AA.auditor_id == user_id,
            )
        )
    else:
        # DPO/Executive might see everything or limited
        access_filter = text("1=1")

    # 2. Sequential ID Logic (CTE)
    id_cte = db.query(
        RopaDocumentModel.id.label("doc_id"),
        func.row_number()
        .over(
            partition_by=extract("year", RopaDocumentModel.created_at),
            order_by=RopaDocumentModel.created_at,
        )
        .label("seq_id"),
        extract("year", RopaDocumentModel.created_at).label("year"),
    ).subquery()

    # Latest Cycle Subquery for deduplication
    latest_cycle_sub = (
        db.query(
            DocumentReviewCycleModel.id.label("cycle_id"),
            DocumentReviewCycleModel.document_id,
            func.row_number()
            .over(
                partition_by=DocumentReviewCycleModel.document_id,
                order_by=DocumentReviewCycleModel.requested_at.desc(),
            )
            .label("rn"),
        )
        .subquery()
    )

    # 3. Base Query
    query = (
        db.query(
            RopaDocumentModel,
            DocumentReviewCycleModel,
            ReviewDpoAssignmentModel,
            UserModel.first_name,
            UserModel.last_name,
            id_cte.c.seq_id,
            id_cte.c.year,
            AuditorAssignmentModel.id.label("auditor_assignment_id"),
            AuditorAssignmentModel.status.label("auditor_status"),
        )
        .select_from(RopaDocumentModel)
        .join(id_cte, id_cte.c.doc_id == RopaDocumentModel.id)
        .outerjoin(
            latest_cycle_sub,
            and_(
                latest_cycle_sub.c.document_id == RopaDocumentModel.id,
                latest_cycle_sub.c.rn == 1,
            ),
        )
        .outerjoin(
            DocumentReviewCycleModel,
            DocumentReviewCycleModel.id == latest_cycle_sub.c.cycle_id,
        )
        .outerjoin(
            ReviewDpoAssignmentModel,
            ReviewDpoAssignmentModel.review_cycle_id == DocumentReviewCycleModel.id,
        )
        .outerjoin(UserModel, UserModel.id == ReviewDpoAssignmentModel.dpo_id)
        .outerjoin(
            AuditorAssignmentModel,
            and_(
                AuditorAssignmentModel.document_id == RopaDocumentModel.id,
                AuditorAssignmentModel.auditor_id == user_id,
            ),
        )
        .filter(access_filter)
    )

    # 4. Filters
    if date_range == "7_days":
        query = query.filter(RopaDocumentModel.created_at >= now - timedelta(days=7))
    elif date_range == "30_days":
        query = query.filter(RopaDocumentModel.created_at >= now - timedelta(days=30))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                RopaDocumentModel.title.ilike(search_term),
                RopaDocumentModel.document_number.ilike(search_term),
            )
        )
    # We apply it at the Python level if needed, but for better performance we can map back to DB enums.

    total_items = query.count()
    results = (
        query.order_by(RopaDocumentModel.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for doc, cycle, dpo_assign, fname, lname, seq, year, aud_assign_id, aud_status in results:
        doc_code = f"RP-{int(year)}-{int(seq):02d}"

        # Calculate UI Status
        internal_status = cycle.status if cycle else "IN_PROGRESS"
        ui_status = "IN_REVIEW"
        ui_label = "รอตรวจสอบ"

        # 1. Logic for Auditor or general status check
        if role == Role.AUDITOR:
            # For Auditors, check their assignment status OR global document status
            aud_status_str = str(getattr(aud_status, "value", aud_status))
            doc_status_str = str(getattr(doc.status, "value", doc.status))

            if "." in aud_status_str:
                aud_status_str = aud_status_str.split(".")[-1]
            if "." in doc_status_str:
                doc_status_str = doc_status_str.split(".")[-1]

            if aud_status_str == "VERIFIED":
                ui_status = "COMPLETED"
                ui_label = "ตรวจสอบเสร็จสิ้น"
            else:
                ui_status = "IN_REVIEW"
                ui_label = "รอตรวจสอบ"
        else:
            # 2. Check if document is COMPLETED globally for other roles
            if str(getattr(doc.status, "value", doc.status)) == "COMPLETED":
                ui_status = "COMPLETED"
                ui_label = "ตรวจสอบเสร็จสิ้น"
            # 3. Otherwise check current cycle status
            elif internal_status == "APPROVED":
                # Even if DPO approved, if it's not COMPLETED globally, it's still being reviewed (e.g. by Auditor)
                if str(getattr(doc.status, "value", doc.status)) == "UNDER_REVIEW":
                    ui_status = "IN_REVIEW"
                    ui_label = "รอตรวจสอบ"
                else:
                    ui_status = "COMPLETED"
                    ui_label = "ตรวจสอบเสร็จสิ้น"
            elif internal_status == "CHANGES_REQUESTED":
                # Check if comments exist in DB to determine who needs to take action
                all_comments = db.query(DpoSectionCommentModel).filter(DpoSectionCommentModel.document_id == doc.id).all()
                
                # Simple check: if any comment exists, someone needs to fix it.
                # We can try to guess the role from the key or just default to DO.
                has_comments = len(all_comments) > 0
                
                # For more precision, we'd need a 'group' column in DpoSectionCommentModel.
                # Since we don't have it, we use the key patterns.
                has_dp_related = any(c.section_key.startswith("DP_") or c.section_key in ["1", "2", "3", "4", "5", "6"] for c in all_comments)
                has_do_related = any(c.section_key.startswith("DO_") or c.section_key in ["1", "2", "3", "4", "5", "6", "7", "risk"] for c in all_comments)

                if role == Role.PROCESSOR:
                    if has_dp_related:
                        ui_status = "ACTION_REQUIRED_DP"
                    else:
                        ui_status = "IN_REVIEW"
                else:
                    if has_do_related:
                        ui_status = "ACTION_REQUIRED_DO"
                    elif has_dp_related:
                        ui_status = "WAITING_FOR_DP"
                    else:
                        ui_status = "IN_REVIEW"

        # Filter by Status if requested
        if status and ui_status != status:
            continue

        items.append(
            OwnerDpoReviewedDocumentTableItem(
                document_id=doc_code,
                raw_document_id=doc.id,
                document_name=doc.title or "Untitled",
                reviewer_name=f"{fname} {lname}" if fname else "Not assigned",
                received_date=dpo_assign.assigned_at if dpo_assign else None,
                review_date=cycle.reviewed_at if cycle else None,
                due_date=doc.due_date,
                status=ui_status,
                is_overdue=(
                    (
                        doc.due_date.replace(tzinfo=timezone.utc)
                        if doc.due_date.tzinfo is None
                        else doc.due_date
                    )
                    < now
                    if doc.due_date
                    else False
                ),
                assignment_id=aud_assign_id,
            )
        )

    return PaginatedOwnerDpoReviewedDocumentResponse(
        total=(
            total_items if not status else len(items)
        ),  # Simplified total if status filtered at Python level
        page=page,
        limit=limit,
        items=items,
        filters={"status": status, "date_range": date_range},
    )
