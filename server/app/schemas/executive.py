from pydantic import BaseModel
from typing import List


class RopaStatusOverview(BaseModel):
    draft: int
    pending: int
    under_review: int
    completed: int
    total: int


class RiskByDepartment(BaseModel):
    department: str
    low: int
    medium: int
    high: int
    total: int


class SensitiveDocByDepartment(BaseModel):
    department: str
    count: int


class PendingDocuments(BaseModel):
    data_owner_count: int
    data_processor_count: int


class ApprovedDocumentsSummary(BaseModel):
    total: int


class PendingDpoReviewSummary(BaseModel):
    for_archiving: int
    for_destruction: int


class ExecutiveDashboardResponse(BaseModel):
    selected_period: str
    ropa_status_overview: RopaStatusOverview
    risk_by_department: List[RiskByDepartment]
    sensitive_docs_by_department: List[SensitiveDocByDepartment]
    pending_documents: PendingDocuments
    approved_documents: ApprovedDocumentsSummary
    pending_dpo_review: PendingDpoReviewSummary
