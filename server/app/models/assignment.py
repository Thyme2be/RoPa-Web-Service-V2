import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import auditor_assignment_status_enum, assignment_status_enum, auditor_type_enum

class AuditorAssignmentModel(Base):
    __tablename__ = "auditor_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    auditor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    auditor_type = Column(auditor_type_enum, nullable=True)
    department = Column(String, nullable=True)
    preferred_first_name = Column(String, nullable=True)
    preferred_last_name = Column(String, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False)
    
    status = Column(auditor_assignment_status_enum, nullable=False, default='IN_REVIEW')
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("RopaDocumentModel", back_populates="auditor_assignments")
    auditor = relationship("UserModel", foreign_keys=[auditor_id])
    assigner = relationship("UserModel", foreign_keys=[assigned_by])


class ProcessorAssignmentModel(Base):
    __tablename__ = "processor_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    processor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(assignment_status_enum, default='IN_PROGRESS')
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("RopaDocumentModel", back_populates="processor_assignments")
    processor = relationship("UserModel", foreign_keys=[processor_id])
    assigner = relationship("UserModel", foreign_keys=[assigned_by])
