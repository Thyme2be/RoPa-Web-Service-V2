from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.api.deps import get_db
from app.core.rbac import Role, require_roles
from app.schemas.user import UserRead
from app.models.master_data import MstDepartmentModel, MstCompanyModel, MstRoleModel
from app.schemas.master_data import (
    MasterDataRead, MasterDataCreate, MasterDataUpdate, 
    RoleMasterDataRead, RoleMasterDataCreate, RoleMasterDataUpdate,
    PaginatedDepartmentResponse, PaginatedCompanyResponse, PaginatedRoleResponse
)

router = APIRouter(prefix="/admin", tags=["Admin — Master Data"])
AdminOnly = Depends(require_roles(Role.ADMIN))

# =============================================================================
# Departments
# =============================================================================

@router.get("/departments", response_model=PaginatedDepartmentResponse, summary="List All Departments")
def list_departments(
    search: Optional[str] = Query(None, description="Search by name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    query = db.query(MstDepartmentModel).filter(MstDepartmentModel.is_active == True)
    if search:
        query = query.filter(MstDepartmentModel.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(MstDepartmentModel.name).offset((page - 1) * limit).limit(limit).all()
    return PaginatedDepartmentResponse(total=total, page=page, limit=limit, items=items)

@router.post("/departments", response_model=MasterDataRead, status_code=status.HTTP_201_CREATED, summary="Create Department")
def create_department(payload: MasterDataCreate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    if db.query(MstDepartmentModel).filter(MstDepartmentModel.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Department already exists.")
    dept = MstDepartmentModel(name=payload.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.put("/departments/{dept_id}", response_model=MasterDataRead, summary="Update Department")
def update_department(dept_id: int, payload: MasterDataUpdate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    dept = db.query(MstDepartmentModel).filter(MstDepartmentModel.id == dept_id, MstDepartmentModel.is_active == True).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    if payload.name is not None: dept.name = payload.name
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Department (Soft Delete)")
def delete_department(dept_id: int, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    dept = db.query(MstDepartmentModel).filter(MstDepartmentModel.id == dept_id, MstDepartmentModel.is_active == True).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    dept.is_active = False
    db.commit()
    return

# =============================================================================
# Companies
# =============================================================================

@router.get("/companies", response_model=PaginatedCompanyResponse, summary="List All Companies")
def list_companies(
    search: Optional[str] = Query(None, description="Search by name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    query = db.query(MstCompanyModel).filter(MstCompanyModel.is_active == True)
    if search:
        query = query.filter(MstCompanyModel.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.order_by(MstCompanyModel.name).offset((page - 1) * limit).limit(limit).all()
    return PaginatedCompanyResponse(total=total, page=page, limit=limit, items=items)

@router.post("/companies", response_model=MasterDataRead, status_code=status.HTTP_201_CREATED, summary="Create Company")
def create_company(payload: MasterDataCreate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    if db.query(MstCompanyModel).filter(MstCompanyModel.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Company already exists.")
    comp = MstCompanyModel(name=payload.name)
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp

@router.put("/companies/{comp_id}", response_model=MasterDataRead, summary="Update Company")
def update_company(comp_id: int, payload: MasterDataUpdate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    comp = db.query(MstCompanyModel).filter(MstCompanyModel.id == comp_id, MstCompanyModel.is_active == True).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found.")
    if payload.name is not None: comp.name = payload.name
    db.commit()
    db.refresh(comp)
    return comp

@router.delete("/companies/{comp_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Company (Soft Delete)")
def delete_company(comp_id: int, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    comp = db.query(MstCompanyModel).filter(MstCompanyModel.id == comp_id, MstCompanyModel.is_active == True).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found.")
    comp.is_active = False
    db.commit()
    return

# =============================================================================
# Roles
# =============================================================================

@router.get("/roles", response_model=PaginatedRoleResponse, summary="List All Roles")
def list_roles(
    search: Optional[str] = Query(None, description="Search by name or code"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: UserRead = AdminOnly,
):
    query = db.query(MstRoleModel).filter(MstRoleModel.is_active == True)
    if search:
        query = query.filter(or_(
            MstRoleModel.name.ilike(f"%{search}%"),
            MstRoleModel.code.ilike(f"%{search}%")
        ))
    total = query.count()
    items = query.order_by(MstRoleModel.id).offset((page - 1) * limit).limit(limit).all()
    return PaginatedRoleResponse(total=total, page=page, limit=limit, items=items)

@router.post("/roles", response_model=RoleMasterDataRead, status_code=status.HTTP_201_CREATED, summary="Create Role")
def create_role(payload: RoleMasterDataCreate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    if db.query(MstRoleModel).filter(MstRoleModel.code == payload.code).first():
        raise HTTPException(status_code=409, detail="Role code already exists.")
    role = MstRoleModel(name=payload.name, code=payload.code)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/roles/{role_id}", response_model=RoleMasterDataRead, summary="Update Role")
def update_role(role_id: int, payload: RoleMasterDataUpdate, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    role = db.query(MstRoleModel).filter(MstRoleModel.id == role_id, MstRoleModel.is_active == True).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    if payload.name is not None: role.name = payload.name
    if payload.code is not None: role.code = payload.code
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Role (Soft Delete)")
def delete_role(role_id: int, db: Session = Depends(get_db), current_user: UserRead = AdminOnly):
    role = db.query(MstRoleModel).filter(MstRoleModel.id == role_id, MstRoleModel.is_active == True).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    role.is_active = False
    db.commit()
    return
