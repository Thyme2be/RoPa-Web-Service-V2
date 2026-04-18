from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class DpoCommentBase(BaseModel):
    section_key: str
    comment: Optional[str] = None

class DpoCommentCreate(DpoCommentBase):
    pass

class DpoCommentBulkRequest(BaseModel):
    group: str # "DO" or "DP"
    comments: List[DpoCommentCreate]

class DpoCommentRead(DpoCommentBase):
    updated_at: datetime

    class Config:
        from_attributes = True
