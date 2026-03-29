from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User, UserRoleEnum
from app.models.document import RopaDocument
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/dashboard", response_model=List[DocumentResponse])
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    # Admin sees all documents globally
    return db.query(RopaDocument).all()

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    return db.query(User).all()

@router.put("/users/{user_id}/role")
def assign_role_to_user(
    user_id: UUID,
    role_name: UserRoleEnum,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.role = role_name
    db.commit()
    return {"message": f"Successfully assigned {role_name.value} to user {target_user.email}"}
