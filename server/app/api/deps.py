from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.enums import UserStatus
from app.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") == "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token cannot be used for authentication")
            
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        token_data = TokenData(user_id=UUID(user_id_str))
    except (JWTError, ValueError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is suspended or inactive"
        )
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role is None or current_user.role.value not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this role or no role assigned"
            )
        return current_user
