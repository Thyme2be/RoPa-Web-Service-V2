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
  status: RopaStatus;
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

  // Backward compatibility aliases if needed
  document_name?: string;
  title?: string;
  document_number?: string;
}

export type ProcessorRecord = RopaProcessorRecord;