import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ropa_section


class RopaProcessorSectionModel(Base):
    __tablename__ = "ropa_processor_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("ropa_documents.id", ondelete="CASCADE"), nullable=False)
    processor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    title_prefix = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    processor_name = Column(String, nullable=True)
    controller_name = Column(String, nullable=True)
    controller_address = Column(Text, nullable=True)
    processing_activity = Column(Text, nullable=True)
    purpose_of_processing = Column(Text, nullable=True)

    data_source_other = Column(Text, nullable=True)
    retention_value = Column(Integer, nullable=True)
    retention_unit = Column(String, nullable=True)
    storage_methods_other = Column(Text, nullable=True)
    access_condition = Column(Text, nullable=True)
    deletion_method = Column(Text, nullable=True)

    legal_basis = Column(Text, nullable=True)
    has_cross_border_transfer = Column(Boolean, nullable=True)
    transfer_country = Column(Text, nullable=True)
    transfer_company = Column(Text, nullable=True)
    transfer_method = Column(Text, nullable=True)
    transfer_protection_standard = Column(Text, nullable=True)
    transfer_exception = Column(Text, nullable=True)
    org_measures = Column(Text, nullable=True)
    access_control_measures = Column(Text, nullable=True)
    technical_measures = Column(Text, nullable=True)
    responsibility_measures = Column(Text, nullable=True)
    physical_measures = Column(Text, nullable=True)
    audit_measures = Column(Text, nullable=True)

    # คำแนะนำ/คำสั่งจาก Data Owner ถึง Data Processor เพื่อให้กรอกข้อมูลตามที่ต้องการ
    do_suggestion = Column(Text, nullable=True)

    status = Column(ropa_section, default='DRAFT')
    is_sent = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('document_id', 'processor_id', name='uq_processor_section'),
    )

    document = relationship("RopaDocumentModel", back_populates="processor_sections")
    processor = relationship("UserModel", foreign_keys=[processor_id])

    personal_data_items = relationship("ProcessorPersonalDataItemModel", back_populates="section", cascade="all, delete-orphan")
    data_categories     = relationship("ProcessorDataCategoryModel", back_populates="section", cascade="all, delete-orphan")
    data_types          = relationship("ProcessorDataTypeModel", back_populates="section", cascade="all, delete-orphan")
    collection_methods  = relationship("ProcessorCollectionMethodModel", back_populates="section", cascade="all, delete-orphan")
    data_sources        = relationship("ProcessorDataSourceModel", back_populates="section", cascade="all, delete-orphan")
    storage_types       = relationship("ProcessorStorageTypeModel", back_populates="section", cascade="all, delete-orphan")
    storage_methods     = relationship("ProcessorStorageMethodModel", back_populates="section", cascade="all, delete-orphan")


class ProcessorPersonalDataItemModel(Base):
    __tablename__ = "processor_personal_data_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="personal_data_items")

class ProcessorDataCategoryModel(Base):
    __tablename__ = "processor_data_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="data_categories")

class ProcessorDataTypeModel(Base):
    __tablename__ = "processor_data_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)
    is_sensitive = Column(Boolean, nullable=False, default=False)

    section = relationship("RopaProcessorSectionModel", back_populates="data_types")

class ProcessorCollectionMethodModel(Base):
    __tablename__ = "processor_collection_methods"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    method = Column(String, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="collection_methods")

class ProcessorDataSourceModel(Base):
    __tablename__ = "processor_data_sources"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="data_sources")

class ProcessorStorageTypeModel(Base):
    __tablename__ = "processor_storage_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="storage_types")

class ProcessorStorageMethodModel(Base):
    __tablename__ = "processor_storage_methods"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    processor_section_id = Column(UUID(as_uuid=True), ForeignKey("ropa_processor_sections.id", ondelete="CASCADE"), nullable=False)
    method = Column(String, nullable=True)
    other_description = Column(Text, nullable=True)

    section = relationship("RopaProcessorSectionModel", back_populates="storage_methods")
