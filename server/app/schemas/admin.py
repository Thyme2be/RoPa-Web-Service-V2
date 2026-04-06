from pydantic import BaseModel, ConfigDict

class TrendInfo(BaseModel):
    direction: str  # "up", "down", "neutral", "alert"
    value: str      # e.g., "+2", "12%", ""
    text_label: str # e.g., "เดือนนี้", "ไม่มีการเปลี่ยนแปลง", "ต้องการการตรวจสอบ"

class UserRoleStat(BaseModel):
    count: int
    trends: TrendInfo

class UsersCount(BaseModel):
    data_owners: UserRoleStat
    data_processors: UserRoleStat
    auditors: UserRoleStat

class DocumentsStats(BaseModel):
    total: int
    trends: TrendInfo

class ChartData(BaseModel):
    draft: int
    in_progress: int
    completed: int
    rejected: int

class DocumentStatusChart(BaseModel):
    this_week: ChartData
    this_month: ChartData
    all_time: ChartData

class AdminDashboardStats(BaseModel):
    users: UsersCount
    documents: DocumentsStats
    document_status_chart: DocumentStatusChart

    model_config = ConfigDict(from_attributes=True)

from app.models.user import UserRoleEnum
from app.models.enums import UserStatus
from pydantic import EmailStr
from typing import Optional, List

class AdminCreateUserRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: EmailStr
    role: Optional[UserRoleEnum] = None
    password: str

class AdminUserListResponse(BaseModel):
    id: str  # Assuming frontend needs ID to manage deletion
    first_name: str
    last_name: str
    email: EmailStr
    role: Optional[UserRoleEnum] = None
    status: UserStatus
    
    model_config = ConfigDict(from_attributes=True)

class AdminUsersPageResponse(BaseModel):
    total_users: int
    active_users: int
    users_list: List[AdminUserListResponse]

from uuid import UUID

class DocumentSummaryStat(BaseModel):
    count: int
    trend: str

class AdminDocumentsSummary(BaseModel):
    total_documents: DocumentSummaryStat
    pending_audit: DocumentSummaryStat

class AdminDocumentListItem(BaseModel):
    id: UUID
    title: str
    data_type: Optional[str] = None
    company: Optional[str] = None
    completeness_percent: int
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class AdminDocumentsResponse(BaseModel):
    summary: AdminDocumentsSummary
    documents_list: List[AdminDocumentListItem]

class WorkTrackingRoleCard(BaseModel):
    count: int
    progress_percent: int

class WorkTrackingRoleSummary(BaseModel):
    data_owner: WorkTrackingRoleCard
    data_processor: WorkTrackingRoleCard
    auditor: WorkTrackingRoleCard

class WorkTrackingListItem(BaseModel):
    id: UUID
    title: str
    responsible_person: str
    auditor_name: str
    last_updated: str
    status: str

    model_config = ConfigDict(from_attributes=True)

class WorkTrackingSummaryResponse(BaseModel):
    role_summary: WorkTrackingRoleSummary
    tracking_list: List[WorkTrackingListItem]
