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


@router.get("/dashboard", summary="Admin: Organisation Dashboard")
def org_dashboard(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN)),
):
    doc_stats = db.query(
        RopaDocumentModel.status,
        func.count(RopaDocumentModel.id).label("count"),
    ).group_by(RopaDocumentModel.status).all()

    doc_by_status = {str(row.status.value): row.count for row in doc_stats}

    user_stats = db.query(
        UserModel.role,
        func.count(UserModel.id).label("count"),
    ).filter(UserModel.status == 'ACTIVE').group_by(UserModel.role).all() 

    users_by_role = {str(row.role.value): row.count for row in user_stats}

    total_processor_assignments = db.query(func.count(ProcessorAssignmentModel.id)).scalar()
    total_auditor_assignments = db.query(func.count(AuditorAssignmentModel.id)).scalar()

    return {
        "summary": {
            "total_documents": sum(doc_by_status.values()),
            "documents_by_status": doc_by_status,
            "total_active_users": sum(users_by_role.values()),
            "users_by_role": users_by_role,
            "total_processor_assignments": total_processor_assignments,
            "total_auditor_assignments": total_auditor_assignments,
        },
        "accessed_by": current_user.email,
    }


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
            "full_name": target_user.full_name,
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
