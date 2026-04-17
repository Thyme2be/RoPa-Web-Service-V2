import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ropa_section

class RopaOwnerSectionModel(Base):
    __tablename__ = "ropa_owner_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    title_prefix = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    contact_email = Column(String, nullable=True)
    company_phone = Column(String, nullable=True)

    data_owner_name = Column(String, nullable=True)
    processing_activity = Column(Text, nullable=True)
    purpose_of_processing = Column(Text, nullable=True)

    data_source_other = Column(Text, nullable=True)
    retention_value = Column(Integer, nullable=True)
    retention_unit = Column(String, nullable=True)
    access_control_policy = Column(Text, nullable=True)
    deletion_method = Column(Text, nullable=True)

    legal_basis = Column(Text, nullable=True)
    has_cross_border_transfer = Column(Boolean, nullable=True)
    transfer_country = Column(Text, nullable=True)
    transfer_in_group = Column(Text, nullable=True)
    transfer_method = Column(Text, nullable=True)
    transfer_protection_standard = Column(Text, nullable=True)
    transfer_exception = Column(Text, nullable=True)
    exemption_usage = Column(Text, nullable=True)
    refusal_handling = Column(Text, nullable=True)

    org_measures = Column(Text, nullable=True)
    access_control_measures = Column(Text, nullable=True)
    technical_measures = Column(Text, nullable=True)
    responsibility_measures = Column(Text, nullable=True)
    physical_measures = Column(Text, nullable=True)
    audit_measures = Column(Text, nullable=True)

    status = Column(ropa_section, default='DRAFT')
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("RopaDocumentModel")

class OwnerPersonalDataItemModel(Base):
    __tablename__ = "owner_personal_data_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

class OwnerDataCategoryModel(Base):
    __tablename__ = "owner_data_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=True)

class OwnerDataTypeModel(Base):
    __tablename__ = "owner_data_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)

class OwnerCollectionMethodModel(Base):
    __tablename__ = "owner_collection_methods"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    method = Column(String, nullable=True)

class OwnerDataSourceModel(Base):
    __tablename__ = "owner_data_sources"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

class OwnerStorageTypeModel(Base):
    __tablename__ = "owner_storage_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)

class OwnerStorageMethodModel(Base):
    __tablename__ = "owner_storage_methods"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)
    method = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

class OwnerMinorConsentModel(Base):
    __tablename__ = "owner_minor_consents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_owner_sections.id", ondelete="CASCADE"), nullable=False)

class OwnerMinorConsentTypeModel(Base):
    __tablename__ = "owner_minor_consent_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consent_id = Column(UUID(as_uuid=True), ForeignKey("owner_minor_consents.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)
