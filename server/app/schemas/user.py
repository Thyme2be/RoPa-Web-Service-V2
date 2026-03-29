from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.enums import UserStatus
from app.models.user import UserRoleEnum

class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: UUID
    role: Optional[UserRoleEnum] = None
    status: UserStatus
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
