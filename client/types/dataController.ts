import { Address } from "cluster";

// types/ropa.ts
export type RopaControllerRecord = {
  
  recordName: string;
  address: string;
  email: string;
  phoneNumber: number;
  
  id: string;

  // 1–4
  dataSubjectName: string;
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 5–6
  dataCategory: "customer" | "partner" | "contact" | "employee";
  dataType: "general" | "sensitive";

  // 7–8
  collectionMethod: "soft file" | "hard copy";
  dataSource: {
    direct: boolean;
    indirect: boolean;
  };

  // 9–10
  legalBasis: string;

  minorConsent: {
    under10: boolean;
    age10to20: boolean;
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
    method: string;
    duration: number;
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