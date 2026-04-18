"""
auth.py ─ Authentication endpoints.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
    get_password_hash,
)
from app.api.deps import get_db, get_current_user
from app.models.user import UserModel, UserSessionModel
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", summary="Get Current User Info (Simplified)")
def get_me(current_user: UserRead = Depends(get_current_user)):
    """
    Returns only first_name, last_name, and role.
    """
    return {
        "title": current_user.title,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role
    }


def _authenticate_user(db: Session, identifier: str, password: str) -> UserModel | None:
    user = db.query(UserModel).filter(
        (UserModel.email == identifier) | (UserModel.username == identifier)
    ).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def _store_refresh_token(db: Session, user_id, token: str) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = UserSessionModel(user_id=user_id, refresh_token_hash=token, expires_at=expires_at)
    db.add(db_token)
    db.commit()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = _authenticate_user(db, payload.username_or_email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    role_name = user.role or "unknown"
    access_token = create_access_token(user.id, role_name)
    refresh_token = create_refresh_token(user.id, role_name)
    _store_refresh_token(db, user.id, refresh_token)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/swagger-login", summary="Swagger UI Login Form", include_in_schema=False)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """This endpoint is specifically designed for Swagger UI's OAuth2 authorization flow."""
    user = _authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    role_name = user.role or "unknown"
    access_token = create_access_token(user.id, role_name)
    
    # Swagger requires token_type to be included
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
    )

    try:
        jwt_payload = decode_refresh_token(payload.refresh_token)
        user_id = jwt_payload.get("sub")
        role = jwt_payload.get("role")
        if not user_id or not role:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db_token = (
        db.query(UserSessionModel)
        .filter(UserSessionModel.refresh_token_hash == payload.refresh_token)
        .first()
    )
    if not db_token or not db_token.is_valid:
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception

    db_token.revoked_at = datetime.now(timezone.utc)
    db.commit()

    new_access = create_access_token(user.id, user.role or "unknown")
    new_refresh = create_refresh_token(user.id, user.role or "unknown")
    _store_refresh_token(db, user.id, new_refresh)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    db_token = (
        db.query(UserSessionModel)
        .filter(UserSessionModel.refresh_token_hash == payload.refresh_token)
        .first()
    )
    if db_token:
        db_token.revoked_at = datetime.now(timezone.utc)
        db.commit()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register New User")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Validate unique email
    if db.query(UserModel).filter(UserModel.email == payload.email).first():
        raise HTTPException(status_code=409, detail=f"อีเมล '{payload.email}' มีในระบบแล้ว")
    
    # Validate unique username
    if db.query(UserModel).filter(UserModel.username == payload.username).first():
        raise HTTPException(status_code=409, detail=f"ชื่อผู้ใช้งาน '{payload.username}' มีในระบบแล้ว")

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
        role=payload.role or "PROCESSOR",  # Default if not specified
        status=payload.status or "ACTIVE",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user
