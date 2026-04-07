import { RopaStatus, DataCategory, DataType, CollectionMethod } from "./enums";

export type RopaProcessorRecord = {
  documentName: string;
  title: string;
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phoneNumber: string;
  status?: RopaStatus;

  id: string;

  // 1–5
  processorName: string;
  controllerName: string; // Changed to string based on UI "ชื่อผู้ควบคุมข้อมูล"
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 6–7
  dataCategory: DataCategory;
  dataType: DataType;

  // 8–9
  collectionMethod: CollectionMethod;
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
    storageType: CollectionMethod;
    method: string;
    duration: number; // Changed to number for consistency with Owner
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