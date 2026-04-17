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

@router.get("/users", response_model=list[UserRead], summary="List All Users")
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    return db.query(UserModel).offset(skip).limit(limit).all()

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
