import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class DpoSectionCommentModel(Base):
    __tablename__ = "dpo_section_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    section_key = Column(String, nullable=False, index=True) # e.g. DO_SEC_1, DP_SEC_1, DO_RISK
    comment = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("RopaDocumentModel")
    creator = relationship("UserModel")
