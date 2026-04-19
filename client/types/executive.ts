export interface RopaStatusOverview {
  draft: number;
  pending: number;
  under_review: number;
  completed: number;
  total: number;
}

export interface RiskByDepartment {
  department: string;
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface SensitiveDocByDepartment {
  department: string;
  count: number;
}

export interface PendingDocuments {
  data_owner_count: number;
  data_processor_count: number;
}

export interface ApprovedDocumentsSummary {
  total: number;
}

export interface PendingDpoReviewSummary {
  for_archiving: number;
  for_destruction: number;
}

export interface ExecutiveDashboardResponse {
  selected_period: string;
  ropa_status_overview: RopaStatusOverview;
  risk_by_department: RiskByDepartment[];
  sensitive_docs_by_department: SensitiveDocByDepartment[];
  pending_documents: PendingDocuments;
  approved_documents: ApprovedDocumentsSummary;
  pending_dpo_review: PendingDpoReviewSummary;
}
