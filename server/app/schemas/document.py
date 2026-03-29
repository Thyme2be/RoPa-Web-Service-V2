from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.document import DocumentStatus

class DocumentBase(BaseModel):
    pass

class DocumentCreate(DocumentBase):
    owner_data: Optional[Dict[str, Any]] = None

class DocumentUpdateOwner(BaseModel):
    processor_id: Optional[UUID] = None
    owner_data: Optional[Dict[str, Any]] = None
    status: Optional[DocumentStatus] = None

class DocumentUpdateProcessor(BaseModel):
    processor_data: Optional[Dict[str, Any]] = None
    status: Optional[DocumentStatus] = None

class DocumentProvideFeedback(BaseModel):
    auditor_feedback: str
    status: Optional[DocumentStatus] = None

class DocumentResponse(BaseModel):
    id: UUID
    owner_id: UUID
    processor_id: Optional[UUID] = None
    owner_data: Optional[Dict[str, Any]] = None
    processor_data: Optional[Dict[str, Any]] = None
    status: DocumentStatus
    auditor_feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
