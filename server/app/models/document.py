import uuid
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import relationship
from app.database import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_PROCESSOR = "pending_processor"
    PENDING_AUDITOR = "pending_auditor"
    APPROVED = "approved"
    REJECTED_PROCESSOR = "rejected_processor"
    REJECTED_OWNER = "rejected_owner"

class AuditorType(str, enum.Enum):
    INTERNAL = "internal"
    OUTSOURCE = "outsource"

class RopaDocument(Base):
    __tablename__ = 'ropa_documents'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.DRAFT)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    sent_to_auditor_at = Column(DateTime, nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    owner_record = relationship("OwnerRecord", back_populates="document", uselist=False, cascade="all, delete-orphan")
    processor_records = relationship("ProcessorRecord", back_populates="document", cascade="all, delete-orphan")
    audits = relationship("AuditorAudit", back_populates="document", cascade="all, delete-orphan")

class AuditorProfile(Base):
    __tablename__ = 'auditor_profiles'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    auditor_type = Column(Enum(AuditorType), nullable=False)
    outsource_company = Column(String, nullable=True)
    public_email = Column(String, nullable=False)
    public_phone = Column(String, nullable=True)
    certification = Column(String, nullable=True)
    appointed_at = Column(Date, nullable=False)
    expired_at = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    user = relationship("User", foreign_keys=[user_id])
    audits = relationship("AuditorAudit", back_populates="auditor")

class OwnerRecord(Base):
    __tablename__ = 'owner_records'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    
    record_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    data_subject_name = Column(String, nullable=True)
    processing_activity = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    personal_data = Column(Text, nullable=True)
    data_category = Column(String, nullable=True)
    data_type = Column(String, nullable=True)
    collection_method = Column(String, nullable=True)
    source_direct = Column(Boolean, nullable=True)
    source_indirect = Column(Boolean, nullable=True)
    legal_basis = Column(Text, nullable=True)
    minor_under10 = Column(Boolean, nullable=True)
    minor_10to20 = Column(Boolean, nullable=True)

    transfer_is_transfer = Column(Boolean, nullable=True)
    transfer_country = Column(String, nullable=True)
    transfer_company_name = Column(String, nullable=True)
    transfer_method = Column(String, nullable=True)
    transfer_protection_std = Column(String, nullable=True)
    transfer_exception = Column(Text, nullable=True)

    retention_storage_type = Column(String, nullable=True)
    retention_method = Column(Text, nullable=True)
    retention_duration = Column(Integer, nullable=True)
    retention_access_control = Column(Text, nullable=True)
    retention_deletion_method = Column(Text, nullable=True)

    exemption_disclosure = Column(Text, nullable=True)
    rejection_note = Column(Text, nullable=True)

    security_organizational = Column(Text, nullable=True)
    security_technical = Column(Text, nullable=True)
    security_physical = Column(Text, nullable=True)
    security_access_control = Column(Text, nullable=True)
    security_responsibility = Column(Text, nullable=True)
    security_audit = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("RopaDocument", back_populates="owner_record")

class ProcessorRecord(Base):
    __tablename__ = 'processor_records'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    record_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    processor_name = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    processing_activity = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    personal_data = Column(Text, nullable=True)
    data_category = Column(String, nullable=True)
    data_type = Column(String, nullable=True)
    collection_method = Column(String, nullable=True)
    source_from_owner = Column(Boolean, nullable=True)
    source_from_other = Column(Boolean, nullable=True)
    legal_basis = Column(Text, nullable=True)

    transfer_is_transfer = Column(Boolean, nullable=True)
    transfer_country = Column(String, nullable=True)
    transfer_is_in_group = Column(Boolean, nullable=True)
    transfer_company_name = Column(String, nullable=True)
    transfer_method = Column(String, nullable=True)
    transfer_protection_std = Column(String, nullable=True)
    transfer_exception = Column(Text, nullable=True)

    retention_storage_type = Column(String, nullable=True)
    retention_method = Column(Text, nullable=True)
    retention_duration = Column(String, nullable=True)
    retention_access_condition = Column(Text, nullable=True)
    retention_deletion_method = Column(Text, nullable=True)

    security_organizational = Column(Text, nullable=True)
    security_technical = Column(Text, nullable=True)
    security_physical = Column(Text, nullable=True)
    security_access_control = Column(Text, nullable=True)
    security_responsibility = Column(Text, nullable=True)
    security_audit = Column(Text, nullable=True)

    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("RopaDocument", back_populates="processor_records")
    assignee = relationship("User", foreign_keys=[assigned_to])

class AuditorAudit(Base):
    __tablename__ = 'auditor_audits'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ropa_doc_id = Column(UUID(as_uuid=True), ForeignKey('ropa_documents.id', ondelete='CASCADE'), nullable=False)
    assigned_auditor_id = Column(UUID(as_uuid=True), ForeignKey('auditor_profiles.id', ondelete='CASCADE'), nullable=False)
    
    status = Column(Enum(DocumentStatus))
    feedback_comment = Column(Text)
    version = Column(Integer)
    approved_at = Column(DateTime, nullable=True)
    request_change_at = Column(DateTime, nullable=True)

    document = relationship("RopaDocument", back_populates="audits")
    auditor = relationship("AuditorProfile", back_populates="audits")
