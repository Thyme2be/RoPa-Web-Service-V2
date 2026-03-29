import uuid
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.database import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_PROCESSOR = "pending_processor"
    PROCESSOR_REPLIED = "processor_replied"
    SUBMITTED_TO_AUDITOR = "submitted_to_auditor"
    AUDITOR_REJECTED = "auditor_rejected"
    COMPLETED = "completed"

class RopaDocument(Base):
    __tablename__ = 'ropa_documents'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    processor_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    owner_data = Column(JSONB, nullable=True)
    processor_data = Column(JSONB, nullable=True)
    
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.DRAFT)
    auditor_feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    owner = relationship("User", foreign_keys=[owner_id])
    processor = relationship("User", foreign_keys=[processor_id])
