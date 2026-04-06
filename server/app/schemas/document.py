from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.document import DocumentStatus, AuditorType

# --- Owner Records ---
class OwnerRecordBase(BaseModel):
    record_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    data_subject_name: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose: Optional[str] = None
    personal_data: Optional[str] = None
    data_category: Optional[str] = None
    data_type: Optional[str] = None
    collection_method: Optional[str] = None
    source_direct: Optional[bool] = None
    source_indirect: Optional[bool] = None
    legal_basis: Optional[str] = None
    minor_under10: Optional[bool] = None
    minor_10to20: Optional[bool] = None
    transfer_is_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_company_name: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_std: Optional[str] = None
    transfer_exception: Optional[str] = None
    retention_storage_type: Optional[str] = None
    retention_method: Optional[str] = None
    retention_duration: Optional[int] = None
    retention_access_control: Optional[str] = None
    retention_deletion_method: Optional[str] = None
    exemption_disclosure: Optional[str] = None
    rejection_note: Optional[str] = None
    security_organizational: Optional[str] = None
    security_technical: Optional[str] = None
    security_physical: Optional[str] = None
    security_access_control: Optional[str] = None
    security_responsibility: Optional[str] = None
    security_audit: Optional[str] = None

class OwnerRecordResponse(OwnerRecordBase):
    id: UUID
    ropa_doc_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Processor Records ---
class ProcessorRecordBase(BaseModel):
    assigned_to: Optional[UUID] = None
    record_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    processor_name: Optional[str] = None
    owner_name: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose: Optional[str] = None
    personal_data: Optional[str] = None
    data_category: Optional[str] = None
    data_type: Optional[str] = None
    collection_method: Optional[str] = None
    source_from_owner: Optional[bool] = None
    source_from_other: Optional[bool] = None
    legal_basis: Optional[str] = None
    transfer_is_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_is_in_group: Optional[bool] = None
    transfer_company_name: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_std: Optional[str] = None
    transfer_exception: Optional[str] = None
    retention_storage_type: Optional[str] = None
    retention_method: Optional[str] = None
    retention_duration: Optional[str] = None
    retention_access_condition: Optional[str] = None
    retention_deletion_method: Optional[str] = None
    security_organizational: Optional[str] = None
    security_technical: Optional[str] = None
    security_physical: Optional[str] = None
    security_access_control: Optional[str] = None
    security_responsibility: Optional[str] = None
    security_audit: Optional[str] = None

class ProcessorRecordResponse(ProcessorRecordBase):
    id: UUID
    ropa_doc_id: UUID
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProcessorAssignment(BaseModel):
    assigned_to: UUID
    processor_name: Optional[str] = None

# --- ROPA Document Wrapper ---
class DocumentCreate(BaseModel):
    title: str
    owner_record: Optional[OwnerRecordBase] = None
    # Hybrid Model: Data Owner can optionally spawn processor records directly upon creation indicating who they want to assign
    processor_records: Optional[List[ProcessorRecordBase]] = None

class DocumentUpdateOwner(BaseModel):
    title: Optional[str] = None
    status: Optional[DocumentStatus] = None
    owner_record: Optional[OwnerRecordBase] = None

class DocumentUpdateProcessor(BaseModel):
    status: Optional[DocumentStatus] = None
    processor_record: Optional[ProcessorRecordBase] = None

class DocumentProvideFeedback(BaseModel):
    status: Optional[DocumentStatus] = None
    feedback_comment: str

class AuditorAuditResponse(BaseModel):
    id: UUID
    status: Optional[DocumentStatus] = None
    feedback_comment: Optional[str] = None
    version: Optional[int] = None
    approved_at: Optional[datetime] = None
    request_change_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    status: DocumentStatus
    version: int
    created_at: datetime
    sent_to_auditor_at: Optional[datetime] = None
    
    owner_record: Optional[OwnerRecordResponse] = None
    processor_records: List[ProcessorRecordResponse] = []
    audits: List[AuditorAuditResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
