export enum RopaStatus {
  Draft = "draft",
  Processing = "processing",         // กำลังดำเนินการ (ทั้ง DO และ DP)
  DoPending = "do_pending",          // DO เสร็จ รอ DP
  Submitted = "submitted",
  Active = "active",
  Rejected = "rejected",
  ReviewPending = "review_pending",  // ส่ง DPO แล้ว รอตรวจสอบ
  DeletePending = "delete_pending",  // ส่งคำขอลบ รอ DPO
  Approved = "approved",             // DPO อนุมัติ
  Destroyed = "destroyed",           // ถูกทำลายแล้ว
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
