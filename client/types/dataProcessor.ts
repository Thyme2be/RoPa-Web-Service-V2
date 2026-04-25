import { RopaStatus, SectionStatus } from "./enums";

export interface ProcessorSubItem {
  id: string;
  type?: string;
  category?: string;
  method?: string;
  source?: string;
  other_description?: string;
}

export interface ProcessorDataTypeItem extends ProcessorSubItem {
  is_sensitive: boolean;
}

export interface RopaProcessorRecord {
  id: string;
  document_id: string;
  processor_id: number;
  status: RopaStatus | SectionStatus;
  is_sent?: boolean;
  updated_at: string;

  // Personal Info
  title_prefix?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;

  // Activity Info
  processor_name?: string;
  controller_name?: string;
  controller_address?: string;
  processing_activity?: string;
  purpose_of_processing?: string;

  // Sub-tables
  personal_data_items: ProcessorSubItem[];
  data_categories: ProcessorSubItem[];
  data_types: ProcessorDataTypeItem[];
  collection_methods: ProcessorSubItem[];
  data_sources: ProcessorSubItem[];
  storage_types: ProcessorSubItem[];
  storage_methods: ProcessorSubItem[];

  data_source_other?: string;
  storage_methods_other?: string;
  retention_value?: number;
  retention_unit?: string;
  access_condition?: string;
  deletion_method?: string;

  legal_basis?: string;
  has_cross_border_transfer?: boolean;
  transfer_country?: string;
  transfer_company?: string;
  transfer_method?: string;
  transfer_protection_standard?: string;
  transfer_exception?: string;
  in_group_transfer?: boolean;
  exemption_usage?: string;

  // TOMs
  org_measures?: string;
  access_control_measures?: string;
  technical_measures?: string;
  responsibility_measures?: string;
  physical_measures?: string;
  audit_measures?: string;
  
  feedbacks?: {
    section_number: number;
    comment: string;
    created_at?: string;
  }[];

  suggestions?: {
    section_id: string;
    comment: string;
    date: string;
  }[];

  // Backward compatibility aliases if needed
  document_name?: string;
  title?: string;
  document_number?: string;
}

export type ProcessorRecord = RopaProcessorRecord;
 
export interface ProcessorAssignedTableItem {
    id: string; // Alias for document_id
    document_id: string;
    document_number?: string;
    title?: string;
    do_name?: string;
    processor_section_id?: string;
    processor_section_status?: SectionStatus;
    assignment_status: string;
    due_date?: string;
    received_at?: string;
    is_sent: boolean;
    owner_title?: string;
    owner_first_name?: string;
    owner_last_name?: string;
    status: { label: string; code: string };
    has_open_feedback: boolean;
    created_at: string;
}
 
export interface ProcessorDraftTableItem {
    document_id: string;
    document_number?: string;
    title?: string;
    processor_section_id?: string;
    last_saved_at?: string;
}