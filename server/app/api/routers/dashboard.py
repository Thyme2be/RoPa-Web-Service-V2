"""
dashboard.py ─ Dashboard endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.models.assignment import AuditorAssignmentModel, ProcessorAssignmentModel
from app.models.document import RopaDocumentModel
from app.models.user import UserModel
from app.schemas.user import UserRead

router = APIRouter(tags=["Dashboard"])


from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import cast, Date
from fastapi import Query
from app.models.section_owner import RopaOwnerSectionModel
from app.models.section_processor import RopaProcessorSectionModel
from app.models.workflow import DocumentReviewCycleModel, ReviewAssignmentModel
from app.schemas.dashboard import AdminDashboardResponse

@router.get("/dashboard", response_model=AdminDashboardResponse, summary="Admin: Organisation Dashboard")
def org_dashboard(
    period: str = Query("30_days", description="Filter period: 7_days, 30_days, overdue, custom, all"),
    custom_date: Optional[str] = Query(None, description="Format YYYY-MM-DD. Required if period=custom"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    now = datetime.now(timezone.utc)
    base_filters = []

    if period == '7_days':
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=7))
    elif period == '30_days':
        base_filters.append(RopaDocumentModel.created_at >= now - timedelta(days=30))
    elif period == 'overdue':
        base_filters.append(RopaDocumentModel.due_date < now)
        base_filters.append(RopaDocumentModel.status.notin_(['COMPLETED', 'EXPIRED']))
    elif period == 'custom':
        if not custom_date:
            raise HTTPException(status_code=400, detail="custom_date is required when period is custom")
        try:
            c_date = datetime.strptime(custom_date, "%Y-%m-%d").date()
            base_filters.append(cast(RopaDocumentModel.created_at, Date) == c_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid custom_date format. Use YYYY-MM-DD")

    base_query = db.query(RopaDocumentModel.id).filter(*base_filters)

    # 1. Document Overview
    total_docs = base_query.count()
    status_counts = db.query(
        RopaDocumentModel.status,
        func.count(RopaDocumentModel.id).label("count")
    ).filter(*base_filters).group_by(RopaDocumentModel.status).all()
    
    docs_by_status = {str(row.status.value): row.count for row in status_counts}
    
    overview_map = {
        "draft": docs_by_status.get('IN_PROGRESS', 0) + docs_by_status.get('DRAFT', 0),
        "pending": docs_by_status.get('PENDING', 0),
        "reviewing": docs_by_status.get('UNDER_REVIEW', 0),
        "completed": docs_by_status.get('COMPLETED', 0)
    }

    def format_stat(q, completed_statuses):
        total = q.count()
        rows = q.all()
        completed = sum(1 for r in rows if getattr(r, 'status', None) and r.status.value in completed_statuses)
        return {"completed": completed, "incomplete": total - completed}

    # Data Owner Sections (COMPLETED = SUBMITTED)
    owner_q = db.query(RopaOwnerSectionModel.id, RopaOwnerSectionModel.status).filter(
        RopaOwnerSectionModel.document_id.in_(base_query)
    )
    owner_stats = format_stat(owner_q, ['SUBMITTED'])

    # Data Processor Sections (COMPLETED = SUBMITTED)
    proc_q = db.query(RopaProcessorSectionModel.id, RopaProcessorSectionModel.status).filter(
        RopaProcessorSectionModel.document_id.in_(base_query)
    )
    proc_stats = format_stat(proc_q, ['SUBMITTED'])

    # DPO Docs (APPROVED)
    dpo_q = db.query(DocumentReviewCycleModel.id, DocumentReviewCycleModel.status).filter(
        DocumentReviewCycleModel.document_id.in_(base_query)
    )
    dpo_stats = format_stat(dpo_q, ['APPROVED'])

    # Auditor Docs (VERIFIED)
    auditor_q = db.query(AuditorAssignmentModel.id, AuditorAssignmentModel.status).filter(
        AuditorAssignmentModel.document_id.in_(base_query)
    )
    auditor_stats = format_stat(auditor_q, ['VERIFIED'])

    # Revisions
    rev_owner_q = db.query(ReviewAssignmentModel.id, ReviewAssignmentModel.status).join(DocumentReviewCycleModel).filter(
        DocumentReviewCycleModel.document_id.in_(base_query),
        ReviewAssignmentModel.role == 'OWNER'
    )
    rev_owner_stats = format_stat(rev_owner_q, ['COMPLETED'])
    
    rev_proc_q = db.query(ReviewAssignmentModel.id, ReviewAssignmentModel.status).join(DocumentReviewCycleModel).filter(
        DocumentReviewCycleModel.document_id.in_(base_query),
        ReviewAssignmentModel.role == 'PROCESSOR'
    )
    rev_proc_stats = format_stat(rev_proc_q, ['COMPLETED'])

    # Deletions
    del_stats = db.query(RopaDocumentModel.deletion_status, func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.deletion_status.isnot(None),
        *base_filters
    ).group_by(RopaDocumentModel.deletion_status).all()
    
    del_map = {(row.deletion_status.value if row.deletion_status else 'NONE'): row.count for row in del_stats}

    return AdminDashboardResponse(
        selected_period=period,
        document_overview={
            "total": total_docs,
            "statuses": {"draft": overview_map["draft"], "pending": overview_map["pending"], "reviewing": overview_map["reviewing"], "completed": overview_map["completed"]}
        },
        role_based_stats={
            "data_owner_docs": {"title": "เอกสารทั้งหมดของผู้รับผิดชอบข้อมูล", **owner_stats},
            "processor_docs": {"title": "เอกสารทั้งหมดของผู้ประมวลผลข้อมูลส่วนบุคคล", **proc_stats},
            "dpo_docs": {"title": "เอกสารทั้งหมดที่ต้องตรวจโดยเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล", **dpo_stats},
            "auditor_docs": {"title": "เอกสารทั้งหมดที่ต้องตรวจสอบโดยผู้ตรวจสอบ", **auditor_stats}
        },
        revision_and_deletion_stats={
            "owner_revisions": {"title": "เอกสารทั้งหมดที่รอผู้รับผิดชอบข้อมูลแก้ไข", **rev_owner_stats},
            "processor_revisions": {"title": "เอกสารทั้งหมดที่รอผู้ประมวลผลข้อมูลส่วนบุคคลแก้ไข", **rev_proc_stats},
            "destroyed_docs": {"title": "เอกสารทั้งหมดที่ถูกทำลาย", "completed": del_map.get('DELETED', 0), "incomplete": 0},
            "due_for_destruction": {"title": "เอกสารทั้งหมดที่ครบกำหนดทำลาย", "completed": 0, "incomplete": del_map.get('DELETE_PENDING', 0)}
        }
    )


@router.get("/{username}/dashboard", summary="Admin: Per-User Dashboard")
def user_dashboard(
    username: str,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    target_user = (
        db.query(UserModel)
        .filter((UserModel.username == username) | (UserModel.email == username))
        .first()
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    created_docs = db.query(
        RopaDocumentModel.status,
        func.count(RopaDocumentModel.id).label("count"),
    ).filter(
        RopaDocumentModel.created_by == target_user.id
    ).group_by(RopaDocumentModel.status).all()

    processor_assignments = db.query(func.count(ProcessorAssignmentModel.id)).filter(
        ProcessorAssignmentModel.processor_id == target_user.id
    ).scalar()

    auditor_assignments = db.query(func.count(AuditorAssignmentModel.id)).filter(
        AuditorAssignmentModel.auditor_id == target_user.id
    ).scalar()

    owned_assignments = db.query(func.count(ProcessorAssignmentModel.id)).filter(
        ProcessorAssignmentModel.assigned_by == target_user.id
    ).scalar()

    return {
        "user": {
            "id": str(target_user.id),
            "email": target_user.email,
            "first_name": target_user.first_name,
            "last_name": target_user.last_name,
            "username": target_user.username,
            "role": target_user.role,
            "status": target_user.status,
        },
        "statistics": {
            "documents_created": {str(r.status.value): r.count for r in created_docs},
            "processor_assignments": processor_assignments,
            "auditor_assignments": auditor_assignments,
            "owned_assignments": owned_assignments,
        },
        "accessed_by": current_user.email,
    }
