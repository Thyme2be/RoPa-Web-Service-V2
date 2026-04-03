export type OwnerRecord = {
  title: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string; 
  status?: "draft" | "submitted" | "active";
  
  id: string;

  // 1–4
  dataSubjectName: string;
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 5–6
  dataCategories: string[]; // Changed to array for multiple Categories
  dataType: "general" | "sensitive";
  storedDataTypes: string[]; // For specific data types (e.g., Name, Address)
  storedDataTypesOther?: string; // New field for "Other" data types

  // 7–8
  collectionMethod: "soft file" | "hard copy"; // acquisition_mode in form
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
    storageType: "soft file" | "hard copy";
    method: string[];
    duration: number;
    unit: "year" | "month" | "day"; // Added for unit support
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
