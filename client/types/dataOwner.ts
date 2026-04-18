import { RopaStatus, DataType, CollectionMethod, RetentionUnit } from "./enums";

export type ProcessingStatus = {
  doStatus: "pending" | "done";
  dpStatus: "pending" | "done";
  doSubmittedDate?: string;
  dpSubmittedDate?: string;
};

export type RiskAssessment = {
  probability: number;  // 1-5
  impact: number;       // 1-5
  total: number;        // probability × impact
  level: "ต่ำ" | "ปานกลาง" | "สูง";
  submittedDate?: string;
};

export type OwnerRecord = {
  documentName: string;
  title: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string;
  rightsEmail?: string;
  rightsPhone?: string;
  status?: RopaStatus;
  dateCreated?: string;

  id: string;

  // Workflow tracking
  processingStatus?: ProcessingStatus;
  workflow?: "processing" | "sent_dpo" | "delete_pending" | "approved" | "destroyed";
  processorCompany?: string;
  dueDate?: string;

  // 1–4
  dataSubjectName: string;
  processingActivity: string;
  purpose: string;
  personalData: string;

  // DP specific fields
  processorName?: string;
  controllerName?: string;

  // 5–6
  dataCategories: string[];
  dataType: DataType | DataType[];  // Support both single and multi-select
  storedDataTypes: string[];
  storedDataTypesOther?: string;

  // 7–8
  collectionMethod: CollectionMethod;
  dataSource: {
    direct: boolean;
    indirect: boolean;
    fromControllerDirect?: boolean; // DP specific
    fromOther?: boolean;           // DP specific
  };

  // 9–10
  legalBasis: string;

  minorConsent: {
    under10: boolean;
    age10to20: boolean;
    none: boolean;
  };

  // 11 transfer
  internationalTransfer: {
    isTransfer: boolean;
    country?: string;
    companyName?: string;
    transferMethod?: string;
    protectionStandard?: string;
    exception?: string;
    isInGroup?: boolean; // DP specific
  };

  // 12 retention
  retention: {
    storageType: CollectionMethod;
    method: string | string[];
    duration: number;
    unit: RetentionUnit;
    accessControl: string;
    accessCondition?: string; // DP specific
    deletionMethod: string;
  };

  // 13–14
  exemptionDisclosure: string;
  rejectionNote?: string;

  // 15 security
  securityMeasures: {
    organizational?: string;
    technical?: string;
    physical?: string;
    accessControl?: string;
    responsibility?: string;
    audit?: string;
  };

  // Risk Assessment
  riskAssessment?: RiskAssessment;

  suggestions?: {
    id: string;
    section: string;
    sectionId: number;
    comment: string;
    reviewer: string;
    date: string;
    status: "pending" | "fixed";
    role: "owner" | "processor";
    statusLabel?: string;
  }[];

  // Processor assignment (for documents page)
  assignedProcessor?: {
    name: string;
    assignedDate: string;
    documentTitle: string;
    receivedDate?: string;
    processorStatus?: "เสร็จสมบูรณ์" | "ไม่เสร็จสมบูรณ์" | "รอดำเนินการ";
  };

  // Timestamps (backend-ready)
  submittedDate?: string;
  updatedDate?: string;
  lastUpdated?: string;
};

// Alias for compatibility if needed
export type RopaRecord = OwnerRecord;
