from pydantic import BaseModel
from typing import Dict, List

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

class AdminUserDashboardResponse(BaseModel):
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
