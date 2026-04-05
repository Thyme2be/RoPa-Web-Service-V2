import { RopaStatus, DataType, CollectionMethod, RetentionUnit } from "./enums";

export type OwnerRecord = {
  documentName: string;
  title: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string; 
  status?: RopaStatus;
  
  id: string;

  // 1–4
  dataSubjectName: string;
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 5–6
  dataCategories: string[]; // Keep as string[] if the user wants flexibility, but DataCategory enum is available
  dataType: DataType;
  storedDataTypes: string[]; // For specific data types (e.g., Name, Address)
  storedDataTypesOther?: string; // New field for "Other" data types

  // 7–8
  collectionMethod: CollectionMethod; // acquisition_mode in form
  dataSource: {
    direct: boolean;
    indirect: boolean;
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
  };

  // 12 retention
  retention: {
    storageType: CollectionMethod;
    method: string[];
    duration: number;
    unit: RetentionUnit; // Added for unit support
    accessControl: string;
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
};
