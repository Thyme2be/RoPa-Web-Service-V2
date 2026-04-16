from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from email_validator import validate_email, EmailNotValidError
from app.schemas.enums import UserRoleEnum, UserStatusEnum, AuditorTypeEnum

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

    @field_validator("username_or_email")
    @classmethod
    def validate_email_format_if_present(cls, v: str) -> str:
        if "@" in v:
            try:
                validate_email(v, check_deliverability=False)
            except EmailNotValidError as e:
                raise ValueError(f"รูปแบบอีเมลไม่ถูกต้อง: {str(e)}")
        return v

class RegisterRequest(BaseModel):
    username: str
    title: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: Optional[UserRoleEnum] = None
    company_name: Optional[str] = None
    auditor_type: Optional[AuditorTypeEnum] = None
    department: Optional[str] = None
    status: Optional[UserStatusEnum] = UserStatusEnum.ACTIVE

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        try:
            validate_email(v, check_deliverability=False)
        except EmailNotValidError as e:
            raise ValueError(f"รูปแบบอีเมลไม่ถูกต้อง: {str(e)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
        if len(v.encode('utf-8')) > 72:
            raise ValueError("รหัสผ่านยาวเกินไป (สูงสุด 72 ตัวอักษร)")
        return v

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str
