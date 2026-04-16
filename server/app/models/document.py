from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import (
    document_status_enum,
    deletion_status_enum,
    risk_level_enum,
    deletion_request_status_enum,
    decision_enum,
    document_participant_role_enum
)

class RopaDocumentModel(Base):
    __tablename__ = "ropa_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(document_status_enum, nullable=False, default='IN_PROGRESS', index=True)
    deletion_status = Column(deletion_status_enum, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    processor_company = Column(String, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    last_approved_at = Column(DateTime(timezone=True), nullable=True)
    next_review_due_at = Column(DateTime(timezone=True), nullable=True)
    review_interval_days = Column(Integer, default=365)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("UserModel", foreign_keys=[created_by])
    updater = relationship("UserModel", foreign_keys=[updated_by])
    
    participants = relationship("DocumentParticipantModel", back_populates="document", cascade="all, delete-orphan")
    risk_assessments = relationship("RopaRiskAssessmentModel", back_populates="document", cascade="all, delete-orphan")
    deletion_requests = relationship("DocumentDeletionRequestModel", back_populates="document", cascade="all, delete-orphan")
    processor_assignments = relationship("ProcessorAssignmentModel", back_populates="document", cascade="all, delete-orphan")
    auditor_assignments = relationship("AuditorAssignmentModel", back_populates="document", cascade="all, delete-orphan")


class RopaRiskAssessmentModel(Base):
    __tablename__ = "ropa_risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    assessed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    likelihood = Column(Integer, nullable=True)
    impact = Column(Integer, nullable=True)
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(risk_level_enum, nullable=True)
    notes = Column(Text, nullable=True)
    assessed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("RopaDocumentModel", back_populates="risk_assessments")
    assessor = relationship("UserModel")


class DocumentDeletionRequestModel(Base):
    __tablename__ = "document_deletion_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner_reason = Column(Text, nullable=False)
    dpo_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    dpo_decision = Column(decision_enum, nullable=True)
    dpo_reason = Column(Text, nullable=True)
    status = Column(deletion_request_status_enum, nullable=False, default='PENDING')
    requested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    decided_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("RopaDocumentModel", back_populates="deletion_requests")


class DocumentParticipantModel(Base):
    __tablename__ = "document_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(document_participant_role_enum, nullable=True)

    document = relationship("RopaDocumentModel", back_populates="participants")
    user = relationship("UserModel")
