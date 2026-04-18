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

router = APIRouter()


from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import cast, Date
from fastapi import Query
from app.models.section_owner import RopaOwnerSectionModel
from app.models.section_processor import RopaProcessorSectionModel
from app.models.workflow import DocumentReviewCycleModel, ReviewAssignmentModel
from app.schemas.dashboard import AdminDashboardResponse

@router.get("/dashboard", response_model=AdminDashboardResponse, summary="Admin: Organisation Dashboard", tags=["Dashboard (Admin)"])
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
    
    docs_by_status = {str(getattr(row.status, 'value', row.status)): row.count for row in status_counts}
    
    overview_map = {
        "draft": docs_by_status.get('IN_PROGRESS', 0) + docs_by_status.get('DRAFT', 0),
        "pending": docs_by_status.get('PENDING', 0),
        "reviewing": docs_by_status.get('UNDER_REVIEW', 0),
        "completed": docs_by_status.get('COMPLETED', 0)
    }

    def format_stat(q, completed_statuses):
        total = q.count()
        rows = q.all()
        completed = sum(1 for r in rows if getattr(r, 'status', None) and getattr(r.status, 'value', r.status) in completed_statuses)
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
    
    del_map = {(getattr(row.deletion_status, 'value', row.deletion_status) if row.deletion_status else 'NONE'): row.count for row in del_stats}

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

from app.models.workflow import ReviewDpoAssignmentModel, ReviewFeedbackModel, DocumentReviewCycleModel
from app.models.document import DocumentDeletionRequestModel, RopaRiskAssessmentModel, RopaDocumentModel
from app.schemas.dashboard import DpoDashboardResponse

@router.get("/dashboard/dpo", response_model=DpoDashboardResponse, summary="DPO: Dashboard", tags=["Dashboard (DPO)"])
def dpo_dashboard(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    # 1. Total Reviewed
    total_assigned = db.query(ReviewDpoAssignmentModel).filter(ReviewDpoAssignmentModel.dpo_id == current_user.id).count()

    # 2. Revision Needed
    rev_needed = db.query(ReviewFeedbackModel.target_type, func.count(ReviewFeedbackModel.id)).\
        join(DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewFeedbackModel.review_cycle_id).\
        join(ReviewDpoAssignmentModel, ReviewDpoAssignmentModel.review_cycle_id == DocumentReviewCycleModel.id).\
        filter(
            ReviewDpoAssignmentModel.dpo_id == current_user.id,
            DocumentReviewCycleModel.status == 'CHANGES_REQUESTED',
            ReviewFeedbackModel.status == 'OPEN'
        ).group_by(ReviewFeedbackModel.target_type).all()
    
    rev_map = {str(getattr(r[0], 'value', r[0])): r[1] for r in rev_needed}
    owner_rev_count = rev_map.get('OWNER_SECTION', 0)
    proc_rev_count = rev_map.get('PROCESSOR_SECTION', 0)

    # 3. Risk Overview
    risks = db.query(RopaRiskAssessmentModel.risk_level, func.count(RopaRiskAssessmentModel.id)).\
        join(RopaDocumentModel, RopaDocumentModel.id == RopaRiskAssessmentModel.document_id).\
        join(DocumentReviewCycleModel, DocumentReviewCycleModel.document_id == RopaDocumentModel.id).\
        join(ReviewDpoAssignmentModel, ReviewDpoAssignmentModel.review_cycle_id == DocumentReviewCycleModel.id).\
        filter(ReviewDpoAssignmentModel.dpo_id == current_user.id).\
        group_by(RopaRiskAssessmentModel.risk_level).all()
        
    risk_map = {str(getattr(r[0], 'value', r[0])): r[1] for r in risks}
    low_risk = risk_map.get('LOW', 0)
    med_risk = risk_map.get('MEDIUM', 0)
    high_risk = risk_map.get('HIGH', 0)
    total_risk = low_risk + med_risk + high_risk

    # 4. Pending DPO Review
    for_archiving = db.query(ReviewDpoAssignmentModel).\
        join(DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewDpoAssignmentModel.review_cycle_id).\
        filter(
            ReviewDpoAssignmentModel.dpo_id == current_user.id,
            DocumentReviewCycleModel.status == 'IN_REVIEW'
        ).count()
        
    for_destruction = db.query(DocumentDeletionRequestModel).filter(
        DocumentDeletionRequestModel.dpo_id == current_user.id,
        DocumentDeletionRequestModel.status == 'PENDING'
    ).count()

    # 5. Auditor Review Status
    auditor_tasks = db.query(AuditorAssignmentModel.status, func.count(AuditorAssignmentModel.id)).\
        filter(AuditorAssignmentModel.assigned_by == current_user.id).\
        group_by(AuditorAssignmentModel.status).all()
        
    aud_status_map = {str(getattr(r[0], 'value', r[0])): r[1] for r in auditor_tasks}
    aud_pending = aud_status_map.get('IN_REVIEW', 0)
    aud_completed = aud_status_map.get('VERIFIED', 0)

    # 6. Approved Documents
    approved_total = db.query(ReviewDpoAssignmentModel).\
        join(DocumentReviewCycleModel, DocumentReviewCycleModel.id == ReviewDpoAssignmentModel.review_cycle_id).\
        filter(
            ReviewDpoAssignmentModel.dpo_id == current_user.id,
            DocumentReviewCycleModel.status == 'APPROVED'
        ).count()

    # 7. Auditor Delayed
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    aud_delayed = db.query(AuditorAssignmentModel).filter(
        AuditorAssignmentModel.assigned_by == current_user.id,
        AuditorAssignmentModel.status != 'VERIFIED',
        AuditorAssignmentModel.due_date < now
    ).count()

    return DpoDashboardResponse(
        total_reviewed={"count": total_assigned},
        revision_needed={"owner_count": owner_rev_count, "processor_count": proc_rev_count},
        risk_overview={"total": total_risk, "low": low_risk, "medium": med_risk, "high": high_risk},
        pending_dpo_review={"for_archiving": for_archiving, "for_destruction": for_destruction},
        auditor_review_status={"pending": aud_pending, "completed": aud_completed},
        approved_documents={"total": approved_total},
        auditor_delayed={"count": aud_delayed}
    )

@router.get("/{id}/dashboard", summary="Admin: Per-User Dashboard", tags=["Dashboard (Admin)"])
def user_dashboard(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    target_user = (
        db.query(UserModel)
        .filter(UserModel.id == id)
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
            "documents_created": {str(getattr(r.status, 'value', r.status)): r.count for r in created_docs},
            "processor_assignments": processor_assignments,
            "auditor_assignments": auditor_assignments,
            "owned_assignments": owned_assignments,
        },
        "accessed_by": current_user.email,
    }


from app.schemas.dashboard import AdminUserDashboardResponse

@router.get("/dashboard/users", response_model=AdminUserDashboardResponse, summary="Admin: User Statistics Dashboard", tags=["Dashboard (Admin)"])
def user_stats_dashboard(
    period: str = Query("30_days", description="Filter period: 7_days, 30_days, overdue, custom"),
    custom_date: Optional[str] = Query(None, description="Format YYYY-MM-DD. Required if period=custom"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    now = datetime.now(timezone.utc)
    base_filters = []

    if period == '7_days':
        base_filters.append(UserModel.created_at >= now - timedelta(days=7))
    elif period == '30_days':
        base_filters.append(UserModel.created_at >= now - timedelta(days=30))
    elif period == 'custom':
        if not custom_date:
            raise HTTPException(status_code=400, detail="custom_date is required when period is custom")
        try:
            c_date = datetime.strptime(custom_date, "%Y-%m-%d").date()
            base_filters.append(cast(UserModel.created_at, Date) == c_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid custom_date format. Use YYYY-MM-DD")
    # 'overdue' has no meaning for users → treat as ALL (no filter)

    # ── 1. User Overview (center donut) ──────────────────────────────────────
    role_counts = db.query(
        UserModel.role,
        func.count(UserModel.id).label("count")
    ).filter(*base_filters, UserModel.status == 'ACTIVE').group_by(UserModel.role).all()

    roles_map = {
        "OWNER": 0,
        "PROCESSOR": 0,
        "DPO": 0,
        "AUDITOR": 0,
        "ADMIN": 0,
        "EXECUTIVE": 0
    }
    for r in role_counts:
        role_key = str(getattr(r.role, 'value', r.role))
        roles_map[role_key] = r.count
        
    total_users = sum(roles_map.values())

    # ── Helper: group by department for a given role ──────────────────────────
    def by_department(role_value: str):
        rows = db.query(
            UserModel.department,
            func.count(UserModel.id).label("count")
        ).filter(
            *base_filters,
            UserModel.role == role_value,
            UserModel.status == 'ACTIVE',
            UserModel.department.isnot(None)
        ).group_by(UserModel.department).all()
        return [{"department": f"แผนกที่ {i+1} [{r.department or 'ไม่ระบุ'}]", "count": r.count} for i, r in enumerate(rows)]

    def by_company(role_value: str):
        rows = db.query(
            UserModel.company_name,
            func.count(UserModel.id).label("count")
        ).filter(
            *base_filters,
            UserModel.role == role_value,
            UserModel.status == 'ACTIVE',
            UserModel.company_name.isnot(None)
        ).group_by(UserModel.company_name).all()
        return [{"company": f"บริษัทที่ {i+1} [{r.company_name or 'ไม่ระบุ'}]", "count": r.count} for i, r in enumerate(rows)]

    # ── 2. Role Breakdowns ────────────────────────────────────────────────────
    owner_by_dept = by_department('OWNER')
    dpo_by_dept   = by_department('DPO')
    admin_by_dept = by_department('ADMIN')
    exec_by_dept  = by_department('EXECUTIVE')
    proc_by_co    = by_company('PROCESSOR')

    # Auditor: Internal → dept, External → company
    aud_internal_rows = db.query(
        UserModel.department,
        func.count(UserModel.id).label("count")
    ).filter(
        *base_filters,
        UserModel.role == 'AUDITOR',
        UserModel.auditor_type == 'INTERNAL',
        UserModel.status == 'ACTIVE'
    ).group_by(UserModel.department).all()

    aud_external_rows = db.query(
        UserModel.company_name,
        func.count(UserModel.id).label("count")
    ).filter(
        *base_filters,
        UserModel.role == 'AUDITOR',
        UserModel.auditor_type == 'EXTERNAL',
        UserModel.status == 'ACTIVE'
    ).group_by(UserModel.company_name).all()

    aud_internal_total = sum(r.count for r in aud_internal_rows)
    aud_external_total = sum(r.count for r in aud_external_rows)

    return AdminUserDashboardResponse(
        selected_period=period,
        user_overview={
            "total": total_users,
            "roles": roles_map
        },
        role_breakdowns={
            "owner_breakdown": {
                "by_department": owner_by_dept
            },
            "processor_breakdown": {
                "by_company": proc_by_co
            },
            "dpo_breakdown": {
                "by_department": dpo_by_dept
            },
            "auditor_breakdown": {
                "internal": {
                    "by_department": [{"department": f"แผนกที่ {i+1} [{r.department or 'ไม่ระบุ'}]", "count": r.count} for i, r in enumerate(aud_internal_rows)]
                },
                "external": {
                    "by_company": [{"company": f"บริษัทที่ {i+1} [{r.company_name or 'ไม่ระบุ'}]", "count": r.count} for i, r in enumerate(aud_external_rows)]
                }
            },
            "admin_breakdown": {
                "by_department": admin_by_dept
            },
            "executive_breakdown": {
                "by_department": exec_by_dept
            }
        }
    )

