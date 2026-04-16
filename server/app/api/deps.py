"""
deps.py ─ FastAPI dependency injection helpers.

get_db          → yields SQLAlchemy Session
get_current_user → decodes JWT, loads user from DB (with role), returns UserRead
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import UserModel
from app.schemas.user import UserRead

# Bearer token extractor
bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserRead:
    """
    1. Extract Bearer token from Authorization header.
    2. Decode + validate JWT access token.
    3. Load user from DB → role is read from DB (not only from JWT).
       This is intentional: if an admin changes a user's role, new access
       is reflected on next login without waiting for token expiry.
    4. Return UserRead (no hashed_password exposed).

    Raises HTTP 401 on invalid/expired token.
    Raises HTTP 403 if account is deactivated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Load from DB — also picks up the latest role value
    user: UserModel | None = db.query(UserModel).filter(
        UserModel.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    return UserRead.model_validate(user)
