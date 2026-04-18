import { RopaStatus, DataCategory, DataType, CollectionMethod, RetentionUnit } from "./enums";

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
  ropaId?: string;
  lastUpdated?: string;
  updatedDate?: string;

  // 1–5
  processorName: string;
  controllerName: string; 
  controllerAddress?: string;
  processingActivity: string;
  purpose: string;
  personalData: string;

  // 6–7
  dataCategories: string[];
  dataType: DataType | DataType[];
  storedDataTypes: string[];
  storedDataTypesOther?: string;

  // 8–9
  collectionMethod: CollectionMethod;
  dataSource: {
    direct: boolean;
    indirect: boolean;
    indirectText?: string;
  };

  // 10
  legalBasis: string;
  exemptionDisclosure?: string;

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
    method: string | string[];
    duration: number;
    unit?: RetentionUnit;
    accessCondition: string;
    accessControl?: string;
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

export type ProcessorRecord = RopaProcessorRecord;