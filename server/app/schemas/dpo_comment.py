from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class DpoCommentBase(BaseModel):
    section_id: Optional[str] = None
    section_key: str
    comment: Optional[str] = None

class DpoCommentCreate(DpoCommentBase):
    pass

class DpoCommentBulkRequest(BaseModel):
    group: str # "DO" or "DP"
    comments: List[DpoCommentCreate]
    is_final: bool = False  # Set to True only when "Confirm Review" is clicked
    status: Optional[str] = None

class DpoCommentRead(DpoCommentBase):
    updated_at: datetime

    class Config:
        from_attributes = True
