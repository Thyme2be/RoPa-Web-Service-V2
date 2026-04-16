from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, EmailStr
from app.schemas.enums import UserRoleEnum, UserStatusEnum, AuditorTypeEnum

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    company_name: Optional[str] = None
    auditor_type: Optional[AuditorTypeEnum] = None

class UserCreate(UserBase):
    password: str
    role: UserRoleEnum = UserRoleEnum.PROCESSOR

class UserRead(UserBase):
    id: UUID
    role: UserRoleEnum
    status: UserStatusEnum
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    status: Optional[UserStatusEnum] = None
    role: Optional[UserRoleEnum] = None
    department: Optional[str] = None
    company_name: Optional[str] = None
    auditor_type: Optional[AuditorTypeEnum] = None
