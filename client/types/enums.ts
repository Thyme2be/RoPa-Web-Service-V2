export enum RopaStatus {
  Draft = "draft",                   // สำหรับ mock เดิม
  Processing = "processing",         // สำหรับ mock เดิม
  IN_PROGRESS = "IN_PROGRESS",       // ตาราง 1
  UNDER_REVIEW = "UNDER_REVIEW",     // ตาราง 2
  COMPLETED = "COMPLETED",           // ตาราง 3
  DELETED = "DELETED",               // ตาราง 4
}

export enum SectionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
}

export enum UserRole {
  OWNER = "OWNER",
  PROCESSOR = "PROCESSOR",
  EXECUTIVE = "EXECUTIVE",
  ADMIN = "ADMIN",
  DPO = "DPO",
  AUDITOR = "AUDITOR"
}

export enum RetentionUnit {
  DAYS = "DAYS",
  MONTHS = "MONTHS",
  YEARS = "YEARS"
}

export enum DataCategory {
  Customer = "customer",
  Partner = "partner",
  Contact = "contact",
  Employee = "employee"
}

export enum DataType {
  General = "general",
  Sensitive = "sensitive"
}

export enum CollectionMethod {
  SoftFile = "soft_file",
  HardCopy = "hard_copy",
  OnlineForm = "online_form",
  Other = "other"
}

