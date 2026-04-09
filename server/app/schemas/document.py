from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from app.models.document import DocumentStatus, AuditorType

# --- Owner Records ---
class OwnerRecordBase(BaseModel):
    record_name: Optional[str] = None
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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
    data_source: Optional[str] = None
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
    retention_duration_unit: Optional[str] = None
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

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "record_name": "string",
                "title_prefix": "string",
                "first_name": "string",
                "last_name": "string",
                "address": "string",
                "email": "string",
                "phone": "string",
                "data_subject_name": "string",
                "processing_activity": "string",
                "purpose": "string",
                "personal_data": "string",
                "data_category": "string",
                "data_type": "string",
                "collection_method": "string",
                "source_direct": True,
                "source_indirect": True,
                "data_source": "string",
                "legal_basis": "string",
                "minor_under10": True,
                "minor_10to20": True,
                "transfer_is_transfer": True,
                "transfer_country": "string",
                "transfer_company_name": "string",
                "transfer_method": "string",
                "transfer_protection_std": "string",
                "transfer_exception": "string",
                "retention_storage_type": "string",
                "retention_method": "string",
                "retention_duration": 0,
                "retention_duration_unit": "string",
                "retention_access_control": "string",
                "retention_deletion_method": "string",
                "exemption_disclosure": "string",
                "rejection_note": "string",
                "security_organizational": "string",
                "security_technical": "string",
                "security_physical": "string",
                "security_access_control": "string",
                "security_responsibility": "string",
                "security_audit": "string"
            }
        }
    )

class OwnerRecordResponse(OwnerRecordBase):
    id: UUID
    ropa_doc_id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Processor Records ---
class ProcessorRecordBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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
    first_name: str
    last_name: str
    record_name: str

# --- ROPA Document Wrapper ---
class DocumentCreate(BaseModel):
    title: str
    owner_record: Optional[OwnerRecordBase] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "ระบบเก็บข้อมูลพนักงานใหม่",
                "owner_record": OwnerRecordBase.model_config["json_schema_extra"]["example"]
            }
        }
    
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

# --- Dashboard Overviews ---
class DocumentDashboardSummary(BaseModel):
    total_documents: int
    pending_audit: int
    rejected_owner: int
    rejected_processor: int

class MonthlyGraphData(BaseModel):
    month: int
    month_name: str
    this_year: int
    last_year: int

class OwnerDashboardResponse(BaseModel):
    summary: DocumentDashboardSummary
    monthly_trend: List[MonthlyGraphData]
    documents_list: List[DocumentResponse]

# --- ROPA Listing Page Wrappers ---
class ActiveActionPermissions(BaseModel):
    can_view: bool
    can_download_excel: bool
    can_edit: bool

class DraftActionPermissions(BaseModel):
    can_edit: bool
    can_delete: bool

class DocumentListSummary(BaseModel):
    total_documents: int
    completed: int
    drafts: int

class DocumentListItem(BaseModel):
    document_id: UUID
    doc_code: Optional[str] = None
    title: str
    date_received: Optional[datetime] = None
    status: DocumentStatus
    actions: ActiveActionPermissions

class DraftListItem(BaseModel):
    document_id: UUID
    draft_code: Optional[str] = None
    title: str
    last_saved: Optional[datetime] = None
    actions: DraftActionPermissions

class OwnerListingResponse(BaseModel):
    summary: DocumentListSummary
    active_items: List[DocumentListItem]
    draft_items: List[DraftListItem]

# --- ROPA Auditor Submission Flow ---
class AuditorSubmissionItem(BaseModel):
    document_id: UUID
    title: str
    date_sent: Optional[datetime] = None
    status: str

class AuditorSubmissionResponse(BaseModel):
    submitted_items: List[AuditorSubmissionItem]

class AuditorReadyItem(BaseModel):
    document_id: UUID
    title: str
    date_created: Optional[datetime] = None

class AuditorReadyResponse(BaseModel):
    ready_items: List[AuditorReadyItem]

class AuditorSubmitPayload(BaseModel):
    auditor_first_name: str
    auditor_last_name: str
    document_titles: List[str]

# --- ROPA Processor Assignment List Flow ---
class ProcessorActionPermissions(BaseModel):
    can_view: bool

class ProcessorAssignmentSummary(BaseModel):
    total_documents: int
    completed: int

class ProcessorAssignmentItem(BaseModel):
    doc_code: Optional[str] = None
    title: str
    date_assigned: Optional[datetime] = None
    date_received: Optional[datetime] = None
    status: str
    actions: ProcessorActionPermissions

class ProcessorAssignmentResponse(BaseModel):
    summary: ProcessorAssignmentSummary
    assigned_items: List[ProcessorAssignmentItem]

# --- ROPA Feedback Flow (DO Perspective) ---
class FeedbackTrend(BaseModel):
    direction: str
    value: str
    text_label: str

class FeedbackSummary(BaseModel):
    total_feedbacks: int
    feedback_trend: FeedbackTrend
    pending_processor: int

class FeedbackListItem(BaseModel):
    document_id: UUID
    doc_code: Optional[str] = None
    title: str
    date_received: Optional[datetime] = None

class FeedbackListResponse(BaseModel):
    summary: FeedbackSummary
    feedback_items: List[FeedbackListItem]

class FeedbackDetailDocument(BaseModel):
    document_id: UUID
    doc_code: Optional[str] = None
    last_edited: Optional[datetime] = None
    auditor_name: str
    document_type: str

class FeedbackSectionItem(BaseModel):
    section_name: str
    comment: str
    status: Optional[str] = None

class FeedbackDetailResponse(BaseModel):
    document: FeedbackDetailDocument
    processor_feedbacks: List[FeedbackSectionItem]
    owner_feedbacks: List[FeedbackSectionItem]


# -------------------------------------------------------------
# 🚀 DATA PROCESSOR SPECIFIC DTOs (Mapped to Integration Guide)
# -------------------------------------------------------------

# --- Sidebar 1: Assignments ---
class ProcessorAssignmentStats(BaseModel):
    total: int
    in_progress: int
    needs_revision: int
    submitted: int

class ProcessorAssignmentRecordItem(BaseModel):
    id: UUID
    doc_code: Optional[str] = None
    title: str
    assigned_by: str
    received_at: datetime
    processor_status: str
    status_display: str
    can_edit: bool

class ProcessorAssignmentListResponse(BaseModel):
    stats: ProcessorAssignmentStats
    records: List[ProcessorAssignmentRecordItem]
    total: int
    page: int
    page_size: int

class ProcessorDocumentDetailResponse(ProcessorRecordBase):
    id: UUID
    doc_code: Optional[str] = None
    title: str
    processor_status: str
    draft_code: Optional[str] = None
    assigned_by: str
    received_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    sent_to_owner_at: Optional[datetime] = None
    updated_at: datetime
    audit_status: Optional[str] = None
    audit_status_display: str
    is_read_only: bool

class ProcessorDraftSaveResponse(BaseModel):
    message: str
    draft_code: Optional[str] = None
    record_id: UUID

class ProcessorConfirmResponse(BaseModel):
    message: str
    record_id: UUID

class ProcessorReadyToSendItem(BaseModel):
    id: UUID
    doc_code: Optional[str] = None
    title: str
    created_at: datetime

class ProcessorReadyToSendResponse(BaseModel):
    records: List[ProcessorReadyToSendItem]
    total: int
    page: int
    page_size: int

# --- Sidebar 2: Documents ---
class ProcessorDocumentStats(BaseModel):
    total: int
    complete: int

class ProcessorActiveRecordItem(BaseModel):
    id: UUID
    doc_code: Optional[str] = None
    title: str
    sent_at: Optional[datetime] = None
    audit_status: Optional[str] = None
    audit_status_display: str
    can_edit: bool

class ProcessorDraftItem(BaseModel):
    id: UUID
    draft_code: Optional[str] = None
    title: str
    updated_at: datetime

class ProcessorDocumentsListResponse(BaseModel):
    stats: ProcessorDocumentStats
    active_records: List[ProcessorActiveRecordItem]
    active_total: int
    active_page: int
    drafts: List[ProcessorDraftItem]
    drafts_total: int
    drafts_page: int
    page_size: int

# --- Sidebar 3: Feedbacks ---
class ProcessorFeedbackItem(BaseModel):
    audit_id: UUID
    doc_code: Optional[str] = None
    title: str
    sent_at: Optional[datetime] = None
    received_at: datetime

class ProcessorFeedbackListResponse(BaseModel):
    feedbacks: List[ProcessorFeedbackItem]
    total: int
    page: int
    page_size: int

class ProcessorFeedbackSectionInfo(BaseModel):
    section: str
    section_label: str
    comment: str

class ProcessorFeedbackDetailResponse(BaseModel):
    audit_id: UUID
    doc_code: Optional[str] = None
    title: str
    last_modified: datetime
    auditor_name: str
    processor_record_id: UUID
    section_feedbacks: List[ProcessorFeedbackSectionInfo]
