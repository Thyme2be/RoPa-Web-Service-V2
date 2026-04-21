from pydantic import BaseModel
from uuid import UUID
from typing import Dict, List, Optional
from datetime import datetime


class DashboardStatItem(BaseModel):
    title: str
    completed: int
    incomplete: int


class DocumentOverview(BaseModel):
    total: int
    statuses: Dict[str, int]


class RoleBasedStats(BaseModel):
    data_owner_docs: DashboardStatItem
    processor_docs: DashboardStatItem
    dpo_docs: DashboardStatItem
    auditor_docs: DashboardStatItem


class RevisionAndDeletionStats(BaseModel):
    owner_revisions: DashboardStatItem
    processor_revisions: DashboardStatItem
    destroyed_docs: DashboardStatItem
    due_for_destruction: DashboardStatItem


class AdminDashboardResponse(BaseModel):
    selected_period: str
    document_overview: DocumentOverview
    role_based_stats: RoleBasedStats
    revision_and_deletion_stats: RevisionAndDeletionStats


# ─── User Dashboard Schemas ───────────────────────────────────────────────────


class DepartmentCount(BaseModel):
    department: str
    count: int


class CompanyCount(BaseModel):
    company: str
    count: int


class SimpleRoleBreakdown(BaseModel):
    by_department: List[DepartmentCount]


class ProcessorBreakdown(BaseModel):
    by_company: List[CompanyCount]


class AuditorInternal(BaseModel):
    by_department: List[DepartmentCount]


class AuditorExternal(BaseModel):
    by_company: List[CompanyCount]


class AuditorBreakdown(BaseModel):
    internal: AuditorInternal
    external: AuditorExternal


class UserRoleOverview(BaseModel):
    total: int
    roles: Dict[str, int]


class RoleBreakdowns(BaseModel):
    owner_breakdown: SimpleRoleBreakdown
    processor_breakdown: ProcessorBreakdown
    dpo_breakdown: SimpleRoleBreakdown
    auditor_breakdown: AuditorBreakdown
    admin_breakdown: SimpleRoleBreakdown
    executive_breakdown: SimpleRoleBreakdown


from app.schemas.user import UserRead


class AdminUserDashboardResponse(BaseModel):
    user: Optional[UserRead] = None  # Re-added for frontend sync
    selected_period: str
    user_overview: UserRoleOverview
    role_breakdowns: RoleBreakdowns


# ─── DPO Dashboard Schemas ────────────────────────────────────────────────────


class TotalReviewed(BaseModel):
    count: int


class RevisionNeeded(BaseModel):
    owner_count: int
    processor_count: int


class RiskOverview(BaseModel):
    total: int
    low: int
    medium: int
    high: int


class PendingDpoReview(BaseModel):
    for_archiving: int
    for_destruction: int


class AuditorReviewStatus(BaseModel):
    pending: int
    completed: int


class ApprovedDocuments(BaseModel):
    total: int


class AuditorDelayed(BaseModel):
    count: int


class DpoDashboardResponse(BaseModel):
    total_reviewed: TotalReviewed
    revision_needed: RevisionNeeded
    risk_overview: RiskOverview
    pending_dpo_review: PendingDpoReview
    auditor_review_status: AuditorReviewStatus
    approved_documents: ApprovedDocuments
    auditor_delayed: AuditorDelayed


class AuditorDashboardResponse(BaseModel):
    total_assigned: int
    pending_audits: int
    completed_audits: int
    overdue_audits: int


class ProcessorDashboardResponse(BaseModel):
    total_assigned: int
    pending_submissions: int
    completed_submissions: int
    revision_needed: int


class DocumentStatusFlags(BaseModel):
    owner_completed: bool
    processor_completed: bool


class DpoDocumentTableItem(BaseModel):
    document_id: str
    raw_document_id: UUID
    title: str
    data_owner_name: str
    assigned_at: datetime
    reviewed_at: Optional[datetime] = None
    status_flags: DocumentStatusFlags
    review_status: str


class PaginatedDpoDocumentTableResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DpoDocumentTableItem]


class DpoDestructionTableItem(BaseModel):
    request_id: str
    raw_document_id: UUID
    document_id: str
    name: str
    owner: str
    received_date: datetime
    destruction_date: Optional[datetime] = None
    status: str


class PaginatedDpoDestructionTableResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DpoDestructionTableItem]


class DpoDestructionReviewRequest(BaseModel):
    status: str  # APPROVED, REJECTED
    rejection_reason: Optional[str] = None


class DpoAuditorAssignmentTableItem(BaseModel):
    assignment_id: str
    document_id: str
    title: str
    auditor_name: str
    assigned_at: datetime
    reviewed_at: Optional[datetime] = None
    review_status: str


class PaginatedDpoAuditorAssignmentTableResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[DpoAuditorAssignmentTableItem]


# --- Documents from DPO (Owner/Processor/Auditor View) ---


class OwnerDpoReviewedDocumentTableItem(BaseModel):
    document_id: str  # RP-YYYY-XX
    raw_document_id: UUID  # UUID for internal routing
    document_name: str
    reviewer_name: Optional[str]  # DPO Name
    received_date: Optional[datetime]  # Date DPO assigned
    review_date: Optional[datetime]  # Date DPO approved/sent feedback
    due_date: Optional[datetime]
    status: str  # IN_REVIEW, ACTION_REQUIRED_DO, ACTION_REQUIRED_DP, DPO_APPROVED
    is_overdue: bool
    assignment_id: Optional[UUID] = None


class PaginatedOwnerDpoReviewedDocumentResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[OwnerDpoReviewedDocumentTableItem]
    filters: Dict[str, Optional[str]]


# --- Per-User Dashboard (Admin View) ---


class UserDashboardStatistics(BaseModel):
    documents_created: Dict[str, int]
    processor_assignments: int
    auditor_assignments: int
    owned_assignments: int


class UserDashboardResponse(BaseModel):
    user: UserRead
    role_dashboard: Optional[dict] = (
        None  # Using dict for flexible role-specific metrics
    )
    statistics: UserDashboardStatistics
