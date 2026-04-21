import { RopaStatus, DataType, CollectionMethod, RetentionUnit, SectionStatus, UserRole } from "./enums";

export interface UserRead {
    id: number;
    title?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    username?: string;
    role: UserRole;
    department?: string;
    company_name?: string;
    status: string;
    created_at: string;
    is_active: boolean;
}

export interface OwnerDashboardData {
  total_documents: number;
  needs_fix_do_count: number;
  needs_fix_dp_count: number;
  risk_low_count: number;
  risk_medium_count: number;
  risk_high_count: number;
  under_review_storage_count: number;
  under_review_deletion_count: number;
  pending_do_count: number;
  pending_dp_count: number;
  completed_count: number;
  sensitive_document_count: number;
  overdue_dp_count: number;
  annual_reviewed_count: number;
  annual_not_reviewed_count: number;
  destruction_due_count: number;
  deleted_count: number;
}


export type ProcessingStatus = {
  do_status: "pending" | "done";
  dp_status: "pending" | "done";
  do_submitted_date?: string;
  dp_submitted_date?: string;
};

export type RiskAssessment = {
  probability: number;  // 1-5
  impact: number;       // 1-5
  total: number;        // probability × impact
  level: "ต่ำ" | "ปานกลาง" | "สูง";
  submitted_date?: string;
};

export type OwnerRecord = {
  id: string;
  document_name: string;
  full_name?: string;     // ชื่อ-นามสกุล รูปแบบพร้อมแสดงผล (backend format)
  title_prefix?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  rights_email?: string;
  rights_phone?: string;
  status?: RopaStatus | SectionStatus;
  date_created?: string;

  // Workflow tracking
  processing_status?: ProcessingStatus;
  workflow?: "processing" | "sent_dpo" | "delete_pending" | "approved" | "destroyed";
  processor_company?: string;
  due_date?: string;

  // Activity Info
  data_subject_name?: string;
  processing_activity?: string;
  purpose_of_processing?: string;
  
  // Data Stored
  personal_data_items: string[];
  data_categories: string[];
  data_types: string[]; 
  stored_data_types_other?: string;

  // Collection & Retention
  collection_method: string;
  data_source_direct: boolean;
  data_source_indirect: boolean;
  data_source_other?: string;
  
  retention_value: number;
  retention_unit: RetentionUnit;
  access_condition: string;
  deletion_method: string;

  // Legal & Transfer
  legal_basis: string;
  minor_consent_types: string[];
  minor_consent_under_10?: boolean;
  minor_consent_10_to_20?: boolean;
  minor_consent_none?: boolean;

  has_cross_border_transfer: boolean;
  transfer_country?: string;
  transfer_company?: string;
  transfer_method?: string;
  transfer_protection_standard?: string;
  transfer_exception?: string;

  exemption_usage: string;
  rejection_note?: string;

  // Security Measures (TOMs)
  org_measures?: string;
  technical_measures?: string;
  physical_measures?: string;
  access_control_measures?: string;
  responsibility_measures?: string;
  audit_measures?: string;

  // Risk Assessment
  risk_assessment?: RiskAssessment;

  suggestions?: {
    id: string;
    section: string;
    section_id: number;
    comment: string;
    reviewer: string;
    date: string;
    status: "pending" | "fixed";
    role: "owner" | "processor";
    status_label?: string;
  }[];

  // Processor assignment (for documents page)
  assigned_processor?: {
    name: string;
    assigned_date: string;
    document_title: string;
    received_date?: string;
    processor_status?: "เสร็จสมบูรณ์" | "ไม่เสร็จสมบูรณ์" | "รอดำเนินการ";
  };

  // Timestamps
  submitted_date?: string;
  updated_date?: string;
  last_updated?: string;
  department?: string;
  deletion_reason?: string;
  deletion_status?: "DELETE_PENDING" | "DELETED" | null;
  deletion_request?: {
      id: string;
      status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
      owner_reason: string;
      dpo_decision?: string;
      dpo_reason?: string;
      requested_at: string;
      decided_at?: string;
  };

  // Additional fields for table/mapping compatibility
  title?: string;
  document_number?: string;
  document_id?: string;
  storage_method?: string;
  storage_methods?: string;
  storage_methods_other?: string;
  storage_type?: string;
  storage_types: string[];
  is_sent?: boolean;
  owner_status?: { code: string; label: string };
  processor_status?: { code: string; label: string };
};

// --- Table Item Interfaces (Matching Backend Schemas) ---

export interface StatusBadge {
  label: string;
  code: string;
}

export interface ActiveTableItem {
  document_id: string;
  document_number: string;
  title: string;
  dp_name: string;
  dp_company: string;
  owner_status: StatusBadge;
  processor_status: StatusBadge;
  due_date: string;
  created_at: string;
  owner_section_id: string;
  owner_section_status: SectionStatus;
  processor_section_id: string;
  processor_section_status: SectionStatus;
  is_risk_complete: boolean;
  deletion_status?: string | null;
}

export interface SentToDpoTableItem {
  document_id: string;
  document_number: string;
  title: string;
  dpo_name: string;
  ui_status: string;
  ui_status_label: string;
  sent_at: string;
  reviewed_at: string;
  due_date: string;
  deletion_status?: string | null;
}

export interface ApprovedTableItem {
  document_id: string;
  document_number: string;
  title: string;
  do_name: string;
  dpo_name: string;
  last_approved_at: string;
  next_review_due_at: string;
  destruction_date: string;
  annual_review_status: "NOT_REVIEWED" | "REVIEWED";
  annual_review_status_label: string;
  deletion_status?: string | null;
}

export interface DestroyedTableItem {
  document_id: string;
  document_number: string;
  title: string;
  do_name: string;
  dpo_name: string;
  deletion_approved_at: string;
  deletion_reason: string;
}

export interface OwnerSnapshotTableItem {
  id: string;
  document_id: string;
  document_number: string;
  title: string;
  created_at: string;
}

export type RopaRecord = OwnerRecord;

