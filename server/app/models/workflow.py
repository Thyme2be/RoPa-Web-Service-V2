import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import (
    review_status_enum,
    review_assignment_status_enum,
    review_assignment_role_enum,
    feedback_status_enum,
    feedback_target_enum
)

class DocumentReviewCycleModel(Base):
    __tablename__ = "document_review_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False)
    cycle_number = Column(Integer, nullable=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(review_status_enum, nullable=False, default='IN_REVIEW')
    requested_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("RopaDocumentModel")
    requester = relationship("UserModel", foreign_keys=[requested_by])
    reviewer = relationship("UserModel", foreign_keys=[reviewed_by])


class ReviewAssignmentModel(Base):
    __tablename__ = "review_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_cycle_id = Column(UUID(as_uuid=True), ForeignKey("document_review_cycles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(review_assignment_role_enum, nullable=False)
    status = Column(review_assignment_status_enum, nullable=False, default='FIX_IN_PROGRESS')
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cycle = relationship("DocumentReviewCycleModel")
    user = relationship("UserModel")


class ReviewFeedbackModel(Base):
    __tablename__ = "review_feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_cycle_id = Column(UUID(as_uuid=True), ForeignKey("document_review_cycles.id", ondelete="CASCADE"), nullable=True)
    section_number = Column(Integer, nullable=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(feedback_target_enum, nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=False)
    field_name = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    status = Column(feedback_status_enum, nullable=False, default='OPEN')
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class ReviewDpoAssignmentModel(Base):
    __tablename__ = "review_dpo_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_cycle_id = Column(UUID(as_uuid=True), ForeignKey("document_review_cycles.id", ondelete="CASCADE"), nullable=False)
    dpo_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assignment_method = Column(String, nullable=True)

    cycle = relationship("DocumentReviewCycleModel")
    dpo = relationship("UserModel")
