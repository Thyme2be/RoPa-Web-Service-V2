import uuid
from sqlalchemy import Column, String, Integer, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.database import Base
from app.models.enums import UserStatus
import enum

class UserRoleEnum(str, enum.Enum):
    DATA_OWNER = "Data Owner"
    DATA_PROCESSOR = "Data Processor"
    AUDITOR = "Auditor"
    ADMIN = "Admin"

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=True, default=None)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    last_login_at = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    password_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class UserNotification(Base):
    __tablename__ = 'user_notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False) # Maps to users.id
    document_id = Column(UUID(as_uuid=True), nullable=True) # Optional link to a specific document
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Integer, default=0) # 0 = False, 1 = True (or use Boolean)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
