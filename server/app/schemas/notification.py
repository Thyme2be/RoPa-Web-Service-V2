from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class NotificationResponse(BaseModel):
    id: UUID
    document_id: Optional[UUID] = None
    title: str
    message: str
    is_read: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
