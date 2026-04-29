"""
admin.py ─ Admin-only user management endpoints.
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.core.security import get_password_hash
from app.schemas.enums import UserRoleEnum, UserStatusEnum, DocumentStatusEnum
from app.schemas.auth import RegisterRequest
from app.schemas.admin_docs import AdminDocumentTableItem, PaginatedAdminDocumentResponse
from app.models.document import RopaDocumentModel, DocumentDeletionRequestModel
from app.models.assignment import ProcessorAssignmentModel, AuditorAssignmentModel
from app.models.workflow import ReviewDpoAssignmentModel, DocumentReviewCycleModel
from app.models.user import UserModel
from app.schemas.user import UserRead, PaginatedUserResponse, PaginatedUserReadItem, UserUpdate
from app.schemas.dashboard import UserDashboardResponse, UserDashboardStatistics
from app.schemas.document import DeletionApprovalRequest
from sqlalchemy.orm import aliased

router = APIRouter(prefix="/admin", tags=["Admin — User Management"])

AdminOnly = Depends(require_roles(Role.ADMIN))

@router.get("/users/{id}/dashboard", response_model=UserDashboardResponse, summary="Admin: Per-User Dashboard")
def user_dashboard(
    id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    from app.api.routers.dashboard import (
        _get_org_metrics_internal,
        _get_owner_metrics_internal,
        _get_processor_metrics_internal,
        _get_dpo_metrics_internal,
        _get_auditor_metrics_internal,
        _get_executive_metrics_internal
    )
    
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
    ).count()

    auditor_assignments = db.query(func.count(AuditorAssignmentModel.id)).filter(
        AuditorAssignmentModel.auditor_id == target_user.id
    ).count()

    owned_assignments = db.query(func.count(ProcessorAssignmentModel.id)).filter(
        ProcessorAssignmentModel.assigned_by == target_user.id
    ).count()

    # Determine role-specific metrics
    role_metrics = None
    role_str = str(getattr(target_user.role, 'value', target_user.role)).upper()
    
    if role_str == 'DPO':
        role_metrics = _get_dpo_metrics_internal(db, target_user.id).model_dump()
    elif role_str == 'AUDITOR':
        role_metrics = _get_auditor_metrics_internal(db, target_user.id).model_dump()
    elif role_str == 'PROCESSOR':
        role_metrics = _get_processor_metrics_internal(db, target_user.id).model_dump()
    elif role_str == 'OWNER':
        role_metrics = _get_owner_metrics_internal(db, target_user.id).model_dump()
    elif role_str == 'EXECUTIVE':
        role_metrics = _get_executive_metrics_internal(db).model_dump()
    elif role_str == 'ADMIN':
        role_metrics = _get_org_metrics_internal(db, "30_days").model_dump()

    return UserDashboardResponse(
        user=UserRead.model_validate(target_user),
        role_dashboard=role_metrics,
        statistics=UserDashboardStatistics(
            documents_created={str(getattr(r.status, 'value', r.status)): r.count for r in created_docs},
            processor_assignments=processor_assignments,
            auditor_assignments=auditor_assignments,
            owned_assignments=owned_assignments,
        )
    )


@router.get("/users", response_model=PaginatedUserResponse, summary="List All Users")
def list_users(
    search: Optional[str] = Query(None, description="Search by first_name, last_name, or email"),
    status: Optional[UserStatusEnum] = Query(None, description="Filter by status"),
    role: Optional[UserRoleEnum] = Query(None, description="Filter by role"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=1000, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    query = db.query(UserModel)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                UserModel.first_name.ilike(search_term),
                UserModel.last_name.ilike(search_term),
                UserModel.email.ilike(search_term)
            )
        )
    if status is not None:
        query = query.filter(UserModel.status == status)
    if role is not None:
        query = query.filter(UserModel.role == role)
        
    total = query.count()
    skip = (page - 1) * limit
    users = query.offset(skip).limit(limit).all()
    
    items = []
    for u in users:
        items.append(
            PaginatedUserReadItem(
                id=u.id,
                user_code=f"user-{u.id:02d}",
                title=u.title,
                first_name=u.first_name,
                last_name=u.last_name,
                email=u.email,
                role=u.role,
                department=u.department,
                company_name=u.company_name,
                status=u.status,
                created_at=u.created_at,
                is_active=getattr(u.status, 'value', u.status) == "ACTIVE"
            )
        )
        
    return PaginatedUserResponse(
        total=total,
        page=page,
        limit=limit,
        items=items
    )


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Create User")
def create_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    if db.query(UserModel).filter(UserModel.email == payload.email).first():
        raise HTTPException(status_code=409, detail=f"Email '{payload.email}' already registered.")
    
    if db.query(UserModel).filter(UserModel.username == payload.username).first():
        raise HTTPException(status_code=409, detail=f"Username '{payload.username}' already registered.")

    user = UserModel(
        email=payload.email,
        username=payload.username,
        title=payload.title,
        first_name=payload.first_name,
        last_name=payload.last_name,
        department=payload.department,
        company_name=payload.company_name,
        auditor_type=payload.auditor_type,
        password_hash=get_password_hash(payload.password),
        role=payload.role or "PROCESSOR",
        status=payload.status or "ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserRead, summary="Update User")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_data = payload.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        user.password_hash = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password") # Remove empty password if present

    if "email" in update_data and update_data["email"] != user.email:
        if db.query(UserModel).filter(UserModel.email == update_data["email"]).first():
            raise HTTPException(status_code=409, detail=f"Email '{update_data['email']}' already registered.")
    
    if "username" in update_data and update_data["username"] != user.username:
        if db.query(UserModel).filter(UserModel.username == update_data["username"]).first():
            raise HTTPException(status_code=409, detail=f"Username '{update_data['username']}' already registered.")

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204, summary="Deactivate User")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = 'INACTIVE'
    db.commit()
@router.get("/documents", response_model=PaginatedAdminDocumentResponse, summary="Admin: List All Documents")
def list_all_documents(
    search: Optional[str] = Query(None, description="Search by title or document_number"),
    status: Optional[DocumentStatusEnum] = Query(None, description="Filter by document status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly
):
    # Aliased for DPO joins
    DpoUser = aliased(UserModel)
    
    # Base Query: Documents joined with Owner (creator)
    query = db.query(
        RopaDocumentModel,
        UserModel.first_name.label("owner_first"),
        UserModel.last_name.label("owner_last"),
        UserModel.department.label("owner_dept"),
        DpoUser.first_name.label("dpo_first"),
        DpoUser.last_name.label("dpo_last")
    ).join(UserModel, RopaDocumentModel.created_by == UserModel.id)\
     .outerjoin(ReviewDpoAssignmentModel, ReviewDpoAssignmentModel.review_cycle_id == (
         db.query(DocumentReviewCycleModel.id)
           .filter(DocumentReviewCycleModel.document_id == RopaDocumentModel.id)
           .order_by(DocumentReviewCycleModel.requested_at.desc())
           .limit(1).correlate(RopaDocumentModel).as_scalar()
     ))\
     .outerjoin(DpoUser, ReviewDpoAssignmentModel.dpo_id == DpoUser.id)\
     .filter(RopaDocumentModel.deletion_status.is_(None))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                RopaDocumentModel.title.ilike(search_term),
                RopaDocumentModel.document_number.ilike(search_term)
            )
        )
    
    if status:
        query = query.filter(RopaDocumentModel.status == status)

    total = query.count()
    skip = (page - 1) * limit
    results = query.order_by(RopaDocumentModel.updated_at.desc()).offset(skip).limit(limit).all()

    items = []
    for row in results:
        doc, o_f, o_l, o_d, d_f, d_l = row
        items.append(
            AdminDocumentTableItem(
                id=doc.id,
                document_number=doc.document_number,
                title=doc.title or "Untitled Document",
                owner_name=f"{o_f} {o_l}" if o_f else "Unknown",
                department=o_d,
                dpo_name=f"{d_f} {d_l}" if d_f else "Not Assigned",
                updated_at=doc.updated_at,
                status=doc.status,
                deletion_status=doc.deletion_status,
            )
        )

    return PaginatedAdminDocumentResponse(
        total=total,
        page=page,
        limit=limit,
        items=items
    )

@router.patch("/deletion-requests/{request_id}/approve", summary="Admin/DPO: Approve or Reject Destruction Request", tags=["Admin — Document Management"])
def approve_destruction_request(
    request_id: UUID,
    payload: DeletionApprovalRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.ADMIN, Role.DPO))
):
    """
    Approve or Reject a document destruction request.
    If APPROVED, the source document's deletion_status is updated to 'DELETED' (or 'DESTROYED').
    """
    req = db.query(DocumentDeletionRequestModel).filter(DocumentDeletionRequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Deletion request not found.")

    req.status = payload.status.upper()
    req.dpo_id = current_user.id
    req.dpo_decision = payload.status.upper()
    req.dpo_reason = payload.rejection_reason
    req.decided_at = datetime.now(timezone.utc)

    if req.status == 'APPROVED':
        doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == req.document_id).first()
        if doc:
            # Sync state: set deletion_status to DELETED (as per enum)
            doc.deletion_status = 'DELETED'
            doc.deleted_at = req.decided_at
            db.add(doc)

    db.add(req)
    db.commit()

    return {
        "message": f"Destruction request {req.status}",
        "request_id": request_id,
        "new_status": req.status
    }
