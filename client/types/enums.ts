export enum RopaStatus {
  Draft = "draft",
  Submitted = "submitted",
  Active = "active"
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
  HardCopy = "hard_copy"
}

export enum RetentionUnit {
  Year = "year",
  Month = "month",
  Day = "day"
}

export enum UserRole {
  DataOwner = "data_owner",
  DataProcessor = "data_processor"
}
