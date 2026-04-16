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
    owner_id: UUID
    status: RopaSectionEnum
    
    first_name: Optional[str]
    last_name: Optional[str]
    processing_activity: Optional[str]
    purpose_of_processing: Optional[str]
    
    updated_at: datetime
    model_config = {"from_attributes": True}

class ProcessorSectionRead(BaseModel):
    id: UUID
    document_id: UUID
    processor_id: UUID
    status: RopaSectionEnum
    
    first_name: Optional[str]
    last_name: Optional[str]
    processor_name: Optional[str]
    processing_activity: Optional[str]
    purpose_of_processing: Optional[str]
    
    updated_at: datetime
    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------
class ProcessorAssignmentRead(BaseModel):
    id: UUID
    document_id: UUID
    processor_id: UUID
    assigned_by: UUID
    status: AssignmentStatusEnum
    due_date: Optional[datetime]

    model_config = {"from_attributes": True}

class AuditorAssignmentRead(BaseModel):
    id: UUID
    document_id: UUID
    auditor_id: UUID
    assigned_by: UUID
    auditor_type: Optional[AuditorTypeEnum]
    status: AuditorAssignmentStatusEnum
    due_date: datetime

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
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class DocumentDetailRead(DocumentRead):
    owner_sections: List[OwnerSectionRead] = []
    processor_sections: List[ProcessorSectionRead] = []
    processor_assignments: List[ProcessorAssignmentRead] = []
    auditor_assignments: List[AuditorAssignmentRead] = []
