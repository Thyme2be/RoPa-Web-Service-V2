from datetime import datetime
from typing import Any, Optional, List
from uuid import UUID

from pydantic import BaseModel
from app.schemas.enums import (
    DocumentStatusEnum, DeletionStatusEnum,
    AssignmentStatusEnum, AuditorAssignmentStatusEnum,
    RopaSectionEnum, AuditorTypeEnum
)

# ---------------------------------------------------------------------------
# Sections (Basic reads for API responses)
# ---------------------------------------------------------------------------
class OwnerSectionRead(BaseModel):
    id: UUID
    document_id: UUID
    owner_id: int
    status: RopaSectionEnum
    
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # These might be contacts if different
    contact_email: Optional[str] = None
    company_phone: Optional[str] = None

    data_owner_name: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose_of_processing: Optional[str] = None
    
    # Lists & Form specifics
    personal_data_categories: List[str] = []
    subject_categories: List[str] = []
    data_types: List[str] = []
    collection_method: Optional[str] = None
    data_source_direct: bool = False
    data_source_indirect: bool = False
    data_source_other: Optional[str] = None
    storage_types: List[str] = []
    storage_methods: List[str] = []
    storage_methods_other: Optional[str] = None
    
    # Retention
    retention_value: Optional[int] = None
    retention_unit: Optional[str] = None
    access_condition: Optional[str] = None
    destruction_method: Optional[str] = None
    
    # Legal & Security
    legal_basis: Optional[str] = None
    minor_consent_types: List[str] = []
    has_cross_border_transfer: bool = False
    transfer_country: Optional[str] = None
    transfer_company: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None
    exemption_usage: Optional[str] = None
    refusal_handling: Optional[str] = None

    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None
    
    updated_at: datetime
    model_config = {"from_attributes": True}

class ProcessorSectionRead(BaseModel):
    id: UUID
    document_id: UUID
    processor_id: int
    status: RopaSectionEnum
    
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    processor_name: Optional[str] = None
    controller_name: Optional[str] = None
    controller_address: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose_of_processing: Optional[str] = None
    
    # Lists
    personal_data_categories: List[str] = []
    subject_categories: List[str] = []
    data_types: List[str] = []
    collection_methods: List[str] = []
    data_sources: List[str] = []
    data_source_other: Optional[str] = None
    storage_types: List[str] = []
    storage_methods: List[str] = []
    storage_methods_other: Optional[str] = None
    
    # Retention
    retention_value: Optional[int] = None
    retention_unit: Optional[str] = None
    access_condition: Optional[str] = None
    destruction_method: Optional[str] = None
    
    # Legal & Security
    legal_basis: Optional[str] = None
    has_cross_border_transfer: bool = False
    transfer_country: Optional[str] = None
    transfer_company: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None
    
    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None
    
    updated_at: datetime
    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------
class ProcessorAssignmentRead(BaseModel):
    id: UUID
    document_id: UUID
    processor_id: int
    assigned_by: int
    status: AssignmentStatusEnum
    due_date: Optional[datetime]

    model_config = {"from_attributes": True}

class AuditorAssignmentRead(BaseModel):
    id: UUID
    document_id: UUID
    auditor_id: int
    assigned_by: int
    auditor_type: Optional[AuditorTypeEnum]
    status: AuditorAssignmentStatusEnum
    due_date: datetime

    model_config = {"from_attributes": True}

class DeletionRequestRead(BaseModel):
    id: UUID
    owner_reason: str
    dpo_reason: Optional[str]
    status: str
    requested_at: datetime
    decided_at: Optional[datetime]

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    review_interval_days: int = 365
    due_date: Optional[datetime] = None
    processor_company: Optional[str] = None

class DocumentRead(BaseModel):
    id: UUID
    title: Optional[str]
    description: Optional[str]
    status: DocumentStatusEnum
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class RiskAssessmentRead(BaseModel):
    likelihood: Optional[int]
    impact: Optional[int]
    risk_score: Optional[int]
    risk_level: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}

class DocumentDetailRead(DocumentRead):
    owner_sections: List[OwnerSectionRead] = []
    processor_sections: List[ProcessorSectionRead] = []
    processor_assignments: List[ProcessorAssignmentRead] = []
    auditor_assignments: List[AuditorAssignmentRead] = []
    deletion_requests: List[DeletionRequestRead] = []
    risk_assessment: Optional[RiskAssessmentRead] = None


# ---------------------------------------------------------------------------
# Assignment Requests
# ---------------------------------------------------------------------------
class DpoAssignRequest(BaseModel):
    dpo_id: int

class AuditorAssignRequest(BaseModel):
    title: str
    first_name: str
    last_name: str
    auditor_type: AuditorTypeEnum
    department: str
    due_date: datetime

class DeletionApprovalRequest(BaseModel):
    status: str # "APPROVED" or "REJECTED"
    rejection_reason: Optional[str] = None
