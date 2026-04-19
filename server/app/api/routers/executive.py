"""
executive.py - Executive dashboard endpoint.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.models.assignment import ProcessorAssignmentModel
from app.models.document import RopaDocumentModel, RopaRiskAssessmentModel
from app.models.master_data import MstDepartmentModel
from app.models.section_owner import RopaOwnerSectionModel, OwnerDataTypeModel
from app.models.section_processor import RopaProcessorSectionModel
from app.models.user import UserModel
from app.models.workflow import ReviewFeedbackModel
from app.schemas.user import UserRead
from app.schemas.executive import (
    ExecutiveDashboardResponse,
    RopaStatusOverview,
    RiskByDepartment,
    SensitiveDocByDepartment,
    PendingDocuments,
    ApprovedDocumentsSummary,
    PendingDpoReviewSummary,
)

router = APIRouter()


def _parse_period(period: str) -> Optional[datetime]:
    """Return cutoff datetime for created_at filter. None = no filter."""
    now = datetime.now(timezone.utc)
    if period == "7_days":
        return now - timedelta(days=7)
    elif period == "30_days":
        return now - timedelta(days=30)
    elif period == "this_month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "this_year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return None


@router.get(
    "/dashboard/executive",
    response_model=ExecutiveDashboardResponse,
    summary="Executive Dashboard - Document overview across the entire system",
    tags=["Dashboard (Executive)"],
)
def executive_dashboard(
    period: str = Query("all", description="Filter: 7_days, 30_days, this_month, this_year, all"),
    department: Optional[str] = Query(None, description="Filter risk by department"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.EXECUTIVE)),
):
    cutoff = _parse_period(period)

    # 0. Get all active departments for the dropdown and stats
    all_depts = db.query(MstDepartmentModel.name).filter(MstDepartmentModel.is_active == True).all()
    all_department_names = [d[0] for d in all_depts]

    # Base query for documents (used as a subquery for performance)
    base_q = db.query(RopaDocumentModel)
    if cutoff:
        base_q = base_q.filter(RopaDocumentModel.created_at >= cutoff)
    
    # Subquery for document IDs to use in subsequent filters
    doc_id_subq = base_q.with_entities(RopaDocumentModel.id).correlate(None).subquery()
    total_docs = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.id.in_(doc_id_subq)).scalar() or 0

    # 1. ROPA Status Overview (Optimized: No N+1 loops)
    # Under Review
    under_review_count = db.query(func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.status == "UNDER_REVIEW",
        RopaDocumentModel.id.in_(doc_id_subq)
    ).scalar() or 0

    # Completed: Both DO and DP sections are SUBMITTED
    completed_count = (
        db.query(func.count(RopaDocumentModel.id))
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .join(RopaProcessorSectionModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.status != "UNDER_REVIEW",
            RopaOwnerSectionModel.status == "SUBMITTED",
            RopaProcessorSectionModel.status == "SUBMITTED",
            RopaDocumentModel.id.in_(doc_id_subq)
        )
        .scalar() or 0
    )

    # Draft: At least one section is DRAFT
    draft_count = (
        db.query(func.count(func.distinct(RopaDocumentModel.id)))
        .outerjoin(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .outerjoin(RopaProcessorSectionModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.status != "UNDER_REVIEW",
            or_(
                RopaOwnerSectionModel.status == "DRAFT",
                RopaProcessorSectionModel.status == "DRAFT"
            ),
            RopaDocumentModel.id.in_(doc_id_subq)
        )
        .scalar() or 0
    )

    # Pending: No sections created yet
    pending_count = (
        db.query(func.count(RopaDocumentModel.id))
        .outerjoin(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .outerjoin(RopaProcessorSectionModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.status != "UNDER_REVIEW",
            RopaOwnerSectionModel.id == None,
            RopaProcessorSectionModel.id == None,
            RopaDocumentModel.id.in_(doc_id_subq)
        )
        .scalar() or 0
    )

    ropa_status = RopaStatusOverview(
        draft=draft_count,
        pending=pending_count,
        under_review=under_review_count,
        completed=completed_count,
        total=total_docs,
    )

    # 2. Risk by Department (Optimized Join)
    risk_query = (
        db.query(
            UserModel.department,
            RopaRiskAssessmentModel.risk_level,
            func.count(RopaRiskAssessmentModel.id).label("cnt")
        )
        .select_from(UserModel)
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.owner_id == UserModel.id)
        .join(RopaRiskAssessmentModel, RopaRiskAssessmentModel.document_id == RopaOwnerSectionModel.document_id)
        .filter(
            UserModel.department.isnot(None),
            RopaOwnerSectionModel.document_id.in_(doc_id_subq)
        )
    )

    if department:
        risk_query = risk_query.filter(UserModel.department == department)

    risk_rows = risk_query.group_by(UserModel.department, RopaRiskAssessmentModel.risk_level).all()

    # Pre-populate map with all departments set to zero
    risk_map = {dname: {"low": 0, "medium": 0, "high": 0} for dname in all_department_names}
    
    for dname, rlevel, count in risk_rows:
        if dname not in risk_map:
            risk_map[dname] = {"low": 0, "medium": 0, "high": 0}
        
        if rlevel == "LOW": risk_map[dname]["low"] = count
        elif rlevel == "MEDIUM": risk_map[dname]["medium"] = count
        elif rlevel == "HIGH": risk_map[dname]["high"] = count

    risk_by_dept = [
        RiskByDepartment(
            department=dept,
            low=v["low"],
            medium=v["medium"],
            high=v["high"],
            total=v["low"] + v["medium"] + v["high"]
        ) for dept, v in risk_map.items()
    ]

    sensitive_rows = (
        db.query(
            UserModel.department,
            func.count(func.distinct(RopaOwnerSectionModel.document_id)).label("cnt")
        )
        .select_from(UserModel)
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.owner_id == UserModel.id)
        .join(OwnerDataTypeModel, OwnerDataTypeModel.owner_section_id == RopaOwnerSectionModel.id)
        .filter(
            UserModel.department.isnot(None),
            OwnerDataTypeModel.type == "sensitive",
            RopaOwnerSectionModel.document_id.in_(doc_id_subq)
        )
        .group_by(UserModel.department)
        .all()
    )
    
    # Pre-populate sensitive map with all departments set to zero
    sensitive_map = {dname: 0 for dname in all_department_names}
    for dname, count in sensitive_rows:
        sensitive_map[dname] = count

    sensitive_by_dept = [SensitiveDocByDepartment(department=d, count=c) for d, c in sensitive_map.items()]

    # 4. Pending Documents (Quick Counts)
    pending_do = db.query(func.count(RopaOwnerSectionModel.id)).filter(
        RopaOwnerSectionModel.status == "DRAFT",
        RopaOwnerSectionModel.document_id.in_(doc_id_subq)
    ).scalar() or 0
    
    pending_dp = db.query(func.count(RopaProcessorSectionModel.id)).filter(
        RopaProcessorSectionModel.status == "DRAFT",
        RopaProcessorSectionModel.document_id.in_(doc_id_subq)
    ).scalar() or 0

    # 5. Approved Total
    approved_total = db.query(func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.status == "COMPLETED",
        RopaDocumentModel.id.in_(doc_id_subq)
    ).scalar() or 0

    # 6. Pending DPO Review
    for_archiving = db.query(func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.status == "UNDER_REVIEW",
        RopaDocumentModel.deletion_status.is_(None),
        RopaDocumentModel.id.in_(doc_id_subq)
    ).scalar() or 0
    
    for_destruction = db.query(func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.deletion_status == "DELETE_PENDING",
        RopaDocumentModel.id.in_(doc_id_subq)
    ).scalar() or 0

    # 7. Final Department List (from Master Data)
    available_depts = all_department_names

    return ExecutiveDashboardResponse(
        selected_period=period,
        ropa_status_overview=ropa_status,
        risk_by_department=risk_by_dept,
        sensitive_docs_by_department=sensitive_by_dept,
        pending_documents=PendingDocuments(
            data_owner_count=pending_do,
            data_processor_count=pending_dp,
        ),
        approved_documents=ApprovedDocumentsSummary(total=approved_total),
        pending_dpo_review=PendingDpoReviewSummary(
            for_archiving=for_archiving,
            for_destruction=for_destruction,
        ),
        available_departments=available_depts
    )
