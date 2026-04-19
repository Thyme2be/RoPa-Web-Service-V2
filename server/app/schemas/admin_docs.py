from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from app.schemas.enums import DocumentStatusEnum

class AdminDocumentTableItem(BaseModel):
    id: UUID
    document_number: Optional[str] = None
    title: str
    owner_name: str
    department: Optional[str] = None
    dpo_name: Optional[str] = None
    updated_at: datetime
    status: DocumentStatusEnum

    class Config:
        from_attributes = True

class PaginatedAdminDocumentResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[AdminDocumentTableItem]
