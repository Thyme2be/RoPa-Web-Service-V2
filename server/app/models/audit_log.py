import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import AuditAction

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(Enum(AuditAction), nullable=False)
    metadata_payload = Column('metadata', JSONB, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    user = relationship("User")
