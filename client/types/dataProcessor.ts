export type RopaProcessorRecord = {
  
  recordName: string;
  address: string;
  email: string;
  phoneNumber: number;
  
  id?: string;

  // 1–5
  processorName: string;
  controllerName: "customer" | "partner";
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 6–7
  dataCategory: "customer" | "partner" | "contact" | "employee";
  dataType: "general" | "sensitive";

  // 8–9
  collectionMethod: "soft file" | "hard copy";
  dataSource: {
    fromControllerDirect: boolean;
    fromOther: boolean;
  };

  // 10
  legalBasis: string;

  // 11 transfer............
  internationalTransfer: {
    isTransfer: boolean;
    country?: string;
    isInGroup?: boolean;
    companyName?: string;
    transferMethod?: string;
    protectionStandard?: string;
    exception?: string;
  };

  // 12 retention
  retention: {
    storageType: "soft_file" | "hard_copy";
    method: string;
    duration: string;
    accessCondition: string;
    deletionMethod: string;
  };

  // 13 security
  securityMeasures: {
    organizational?: string;
    technical?: string;
    physical?: string;
    accessControl?: string;
    responsibility?: string;
    audit?: string;
  };
};