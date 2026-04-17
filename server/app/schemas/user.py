from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, field_validator
from email_validator import validate_email, EmailNotValidError
from app.schemas.enums import UserRoleEnum, UserStatusEnum, AuditorTypeEnum

class UserBase(BaseModel):
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    company_name: Optional[str] = None
    auditor_type: Optional[AuditorTypeEnum] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        try:
            validate_email(v, check_deliverability=False, test_environment=True)
        except EmailNotValidError as e:
            # fallback loose check to never block response dumps for older invalid emails
            if "@" not in v:
                raise ValueError(f"Invalid email: {str(e)}")
        return v


class UserCreate(UserBase):
    password: str
    role: UserRoleEnum = UserRoleEnum.PROCESSOR

class UserRead(UserBase):
    id: int
    role: UserRoleEnum
    status: UserStatusEnum
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    status: Optional[UserStatusEnum] = None
    role: Optional[UserRoleEnum] = None
    department: Optional[str] = None
    company_name: Optional[str] = None
    auditor_type: Optional[AuditorTypeEnum] = None
