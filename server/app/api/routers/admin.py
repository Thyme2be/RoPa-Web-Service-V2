"""
admin.py ─ Admin-only user management endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.core.security import get_password_hash
from app.models.user import UserModel
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/admin", tags=["Admin — User Management"])

AdminOnly = Depends(require_roles(Role.ADMIN))

from sqlalchemy import or_
from fastapi import Query
from typing import Optional
from app.schemas.user import PaginatedUserResponse, PaginatedUserReadItem
from app.schemas.enums import UserRoleEnum, UserStatusEnum

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
        title_val = None
        fname_val = u.first_name
        
        if u.first_name and " " in u.first_name:
            parts = u.first_name.split(" ", 1)
            title_val = parts[0]
            fname_val = parts[1]
            
        items.append(
            PaginatedUserReadItem(
                id=u.id,
                user_code=f"user-{u.id:02d}",
                title=title_val,
                first_name=fname_val,
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

from app.schemas.auth import RegisterRequest

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
        first_name=f"{payload.title} {payload.first_name}".strip() if payload.title else payload.first_name,
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
    
    if payload.title is not None or payload.first_name is not None:
        current_title = ""
        current_fname = user.first_name or ""
        if " " in current_fname:
            parts = current_fname.split(" ", 1)
            current_title = parts[0]
            current_fname = parts[1]
        
        new_title = payload.title if payload.title is not None else current_title
        new_fname = payload.first_name if payload.first_name is not None else current_fname
        
        user.first_name = f"{new_title} {new_fname}".strip() if new_title else new_fname

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
