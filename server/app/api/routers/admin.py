"""
admin.py ─ Admin-only user management endpoints.
"""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.core.security import get_password_hash
from app.schemas.enums import UserRoleEnum, UserStatusEnum, DocumentStatusEnum
from app.schemas.auth import RegisterRequest
from app.schemas.admin_docs import AdminDocumentTableItem, PaginatedAdminDocumentResponse
from app.models.document import RopaDocumentModel, DocumentDeletionRequestModel
from app.models.workflow import ReviewDpoAssignmentModel, DocumentReviewCycleModel
from app.models.user import UserModel
from app.schemas.user import UserRead, PaginatedUserResponse, PaginatedUserReadItem, UserUpdate
from app.schemas.document import DeletionApprovalRequest
from sqlalchemy.orm import aliased

router = APIRouter(prefix="/admin", tags=["Admin — User Management"])

AdminOnly = Depends(require_roles(Role.ADMIN))


@router.get("/users", response_model=PaginatedUserResponse, summary="List All Users")
def list_users(
    search: Optional[str] = Query(None, description="Search by first_name, last_name, or email"),
    status: Optional[UserStatusEnum] = Query(None, description="Filter by status"),
    role: Optional[UserRoleEnum] = Query(None, description="Filter by role"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
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

    if payload.password:
        user.password_hash = get_password_hash(payload.password)
    
    if payload.title is not None: user.title = payload.title
    if payload.first_name is not None: user.first_name = payload.first_name
    if payload.last_name is not None: user.last_name = payload.last_name
    if payload.username is not None: user.username = payload.username
    if payload.status is not None: user.status = payload.status
    if payload.role is not None: user.role = payload.role
    if payload.department is not None: user.department = payload.department
    if payload.company_name is not None: user.company_name = payload.company_name
    if payload.auditor_type is not None: user.auditor_type = payload.auditor_type

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
    limit: int = Query(10, ge=1, le=100),
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
     .outerjoin(DpoUser, ReviewDpoAssignmentModel.dpo_id == DpoUser.id)

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
                status=doc.status
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
