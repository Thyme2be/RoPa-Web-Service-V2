"""
executive.py - Executive dashboard endpoint.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.models.assignment import ProcessorAssignmentModel
from app.models.document import RopaDocumentModel, RopaRiskAssessmentModel
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
    department: Optional[str] = Query(None, description="Filter risk by department (auditor_assignments.department)"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.EXECUTIVE)),
):
    cutoff = _parse_period(period)

    # Base query - all documents, filtered by period (created_at)
    base_q = db.query(RopaDocumentModel)
    if cutoff:
        base_q = base_q.filter(RopaDocumentModel.created_at >= cutoff)

    all_docs = base_q.all()
    doc_ids = [d.id for d in all_docs]

    # ROPA status 4 values
    draft_count = 0
    pending_count = 0
    under_review_count = 0
    completed_count = 0

    for doc in all_docs:
        owner_sec = db.query(RopaOwnerSectionModel).filter(
            RopaOwnerSectionModel.document_id == doc.id
        ).first()
        proc_sec = db.query(RopaProcessorSectionModel).filter(
            RopaProcessorSectionModel.document_id == doc.id
        ).first()

        # Draft = owner or processor section still DRAFT
        if (owner_sec and owner_sec.status == "DRAFT") or (proc_sec and proc_sec.status == "DRAFT"):
            draft_count += 1
            continue

        # Pending = has open feedback
        has_open_feedback = db.query(ReviewFeedbackModel).filter(
            ReviewFeedbackModel.target_id.in_(
                [s.id for s in [owner_sec, proc_sec] if s]
            ),
            ReviewFeedbackModel.status == "OPEN",
        ).first() is not None
        if has_open_feedback:
            pending_count += 1
            continue

        # Under review = document UNDER_REVIEW or processor_assignment SUBMITTED awaiting DO
        if doc.status == "UNDER_REVIEW":
            under_review_count += 1
            continue

        proc_assignment = db.query(ProcessorAssignmentModel).filter(
            ProcessorAssignmentModel.document_id == doc.id,
            ProcessorAssignmentModel.status == "SUBMITTED",
        ).first()
        if proc_assignment and doc.status == "IN_PROGRESS":
            under_review_count += 1
            continue

        # Completed = both owner and processor SUBMITTED
        if (
            owner_sec and owner_sec.status == "SUBMITTED"
            and proc_sec and proc_sec.status == "SUBMITTED"
        ):
            completed_count += 1

    ropa_status = RopaStatusOverview(
        draft=draft_count,
        pending=pending_count,
        under_review=under_review_count,
        completed=completed_count,
        total=len(all_docs),
    )

    # Risk by department (from users.department of the Data Owner who created the document)
    dept_q = (
        db.query(
            UserModel.department,
            RopaRiskAssessmentModel.risk_level,
            func.count(RopaRiskAssessmentModel.id).label("cnt"),
        )
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .join(UserModel, UserModel.id == RopaOwnerSectionModel.owner_id)
        .join(RopaRiskAssessmentModel, RopaRiskAssessmentModel.document_id == RopaDocumentModel.id)
        .filter(
            UserModel.department.isnot(None),
            RopaDocumentModel.id.in_(doc_ids),
        )
    )
    if department:
        dept_q = dept_q.filter(UserModel.department == department)

    dept_rows = dept_q.group_by(
        UserModel.department,
        RopaRiskAssessmentModel.risk_level,
    ).all()

    risk_map: dict = {}
    for dept, risk_level, cnt in dept_rows:
        if dept not in risk_map:
            risk_map[dept] = {"low": 0, "medium": 0, "high": 0}
        if risk_level == "LOW":
            risk_map[dept]["low"] += cnt
        elif risk_level == "MEDIUM":
            risk_map[dept]["medium"] += cnt
        elif risk_level == "HIGH":
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

    # Sensitive documents by department (from users.department of the Data Owner)
    sensitive_rows = (
        db.query(
            UserModel.department,
            func.count(func.distinct(RopaDocumentModel.id)).label("cnt"),
        )
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .join(UserModel, UserModel.id == RopaOwnerSectionModel.owner_id)
        .join(OwnerDataTypeModel, OwnerDataTypeModel.owner_section_id == RopaOwnerSectionModel.id)
        .filter(
            UserModel.department.isnot(None),
            OwnerDataTypeModel.is_sensitive == True,
            RopaDocumentModel.id.in_(doc_ids),
        )
        .group_by(UserModel.department)
        .all()
    )
    sensitive_by_dept = [
        SensitiveDocByDepartment(department=dept, count=cnt)
        for dept, cnt in sensitive_rows
    ]

    # Pending documents (DRAFT sections)
    pending_do = (
        db.query(func.count(RopaOwnerSectionModel.id))
        .join(RopaDocumentModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaOwnerSectionModel.status == "DRAFT",
            RopaDocumentModel.id.in_(doc_ids),
        )
        .scalar() or 0
    )
    pending_dp = (
        db.query(func.count(RopaProcessorSectionModel.id))
        .join(RopaDocumentModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaProcessorSectionModel.status == "DRAFT",
            RopaDocumentModel.id.in_(doc_ids),
        )
        .scalar() or 0
    )

    # Approved documents (DPO approved) - use last_approved_at when period filter is active
    if cutoff:
        approved_total = (
            db.query(func.count(RopaDocumentModel.id))
            .filter(
                RopaDocumentModel.status == "COMPLETED",
                RopaDocumentModel.last_approved_at >= cutoff,
            )
            .scalar() or 0
        )
    else:
        approved_total = (
            db.query(func.count(RopaDocumentModel.id))
            .filter(
                RopaDocumentModel.status == "COMPLETED",
                RopaDocumentModel.id.in_(doc_ids),
            )
            .scalar() or 0
        )

    # Pending DPO review
    for_archiving = (
        db.query(func.count(RopaDocumentModel.id))
        .filter(
            RopaDocumentModel.status == "UNDER_REVIEW",
            RopaDocumentModel.deletion_status.is_(None),
            RopaDocumentModel.id.in_(doc_ids),
        )
        .scalar() or 0
    )
    for_destruction = (
        db.query(func.count(RopaDocumentModel.id))
        .filter(
            RopaDocumentModel.deletion_status == "DELETE_PENDING",
            RopaDocumentModel.id.in_(doc_ids),
        )
        .scalar() or 0
    )

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
    )
