from pydantic import BaseModel
from typing import Dict

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
