from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MasterDataRead(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}

# Create Schemas
class MasterDataCreate(BaseModel):
    name: str

# Update Schemas
class MasterDataUpdate(BaseModel):
    name: Optional[str] = None

# Paginated Responses
class PaginatedDepartmentResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[MasterDataRead]

class PaginatedCompanyResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[MasterDataRead]

class PaginatedRoleResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[MasterDataRead]
