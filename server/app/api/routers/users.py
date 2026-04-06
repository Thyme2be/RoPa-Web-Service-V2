from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User, UserRoleEnum
from app.schemas.user import UserResponse, UserMeResponse
from app.api.deps import get_current_user, RoleChecker, get_db

router = APIRouter()

@router.get("/me", response_model=UserMeResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/me/assign-role")
def assign_role_to_me(role_name: UserRoleEnum, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Endpoint for testing: Assign a role to yourself."""
    current_user.role = role_name
    db.commit()
    return {"message": f"Assigned role {role_name.value} successfully"}

# Role protected routes for testing
@router.get("/owner-dashboard")
def read_owner_dashboard(current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))):
    return {"message": f"Welcome to the Data Owner Dashboard, {current_user.role.value}!"}

@router.get("/processor-dashboard")
def read_processor_dashboard(current_user: User = Depends(RoleChecker(["Data processor", "Admin"]))):
    return {"message": f"Welcome to the Data Processor Dashboard, {current_user.role.value}!"}

@router.get("/auditor-dashboard")
def read_auditor_dashboard(current_user: User = Depends(RoleChecker(["Auditor", "Admin"]))):
    return {"message": f"Welcome to the Auditor Dashboard, {current_user.role.value}!"}
