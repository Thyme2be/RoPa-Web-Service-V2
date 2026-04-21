"""
processor.py ─ Pydantic schemas สำหรับ Data Processor

ครอบคลุมทุกหน้าที่ Data Processor ใช้งาน:
  - ตารางเอกสารที่ถูก assign
  - กรอก/บันทึก Processor Section
  - ดู feedback ที่ได้รับจาก DO
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.enums import (
    AssignmentStatusEnum,
    RopaSectionEnum,
)

# Import sub-table schemas จาก owner.py (ใช้ schema เดียวกัน)
from app.schemas.owner import (
    PersonalDataItemIn,
    PersonalDataItemOut,
    DataCategoryIn,
    DataCategoryOut,
    DataTypeIn,
    DataTypeOut,
    CollectionMethodIn,
    CollectionMethodOut,
    DataSourceIn,
    DataSourceOut,
    StorageTypeIn,
    StorageTypeOut,
    StorageMethodIn,
    StorageMethodOut,
    ProcessorStatusBadge,
    FeedbackRead,
)


# ใช้ชื่อ alias เพื่อ backward-compat กับ router ที่ import ชื่อนี้อยู่
OwnerStatusBadgeForDp = ProcessorStatusBadge


# =============================================================================
# Processor Section Save/Submit
# =============================================================================

class ProcessorSectionSave(BaseModel):
    """
    Payload สำหรับบันทึกฉบับร่างหรือบันทึกสมบูรณ์ของ Processor Section
    ทุก field เป็น Optional เพราะ DP สามารถบันทึกแค่บางส่วนก็ได้

    Sections ใน UI (DP form มี 6 sections):
      Section 1 (ผู้บันทึก): title_prefix, first_name, last_name, address, email, phone
      Section 2 (รายละเอียดกิจกรรม): processor_name, controller_address, processing_activity, purpose_of_processing
      Section 3 (ข้อมูลที่จัดเก็บ): personal_data_items, data_categories, data_types, collection_methods, data_sources
      Section 4 (การได้มาและการเก็บรักษา): storage_types, storage_methods, retention_value, retention_unit, access_policy, deletion_method
      Section 5 (ฐานทางกฎหมายและการส่งต่อ): legal_basis, has_cross_border_transfer, transfer_*
      Section 6 (มาตรการรักษาความคงปลอดภัย TOMs): org_measures, access_control_measures, ...
    """
    # Meta fields (optional)
    status: Optional[str] = None
    is_sent: Optional[bool] = None

    # Section 1 – ผู้บันทึก (ข้อมูลส่วนตัว DP)
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    # Section 2 – ข้อมูล Processor
    processor_name: Optional[str] = None
    controller_name: Optional[str] = None
    controller_address: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose_of_processing: Optional[str] = None

    # Section 3 – ข้อมูลส่วนบุคคล (sub-tables)
    personal_data_items: Optional[List[PersonalDataItemIn]] = None
    data_categories: Optional[List[DataCategoryIn]] = None
    data_types: Optional[List[DataTypeIn]] = None
    collection_methods: Optional[List[CollectionMethodIn]] = None
    data_sources: Optional[List[DataSourceIn]] = None

    # Section 4 – การได้มาและการเก็บรักษา
    storage_types: Optional[List[StorageTypeIn]] = None
    storage_methods: Optional[List[StorageMethodIn]] = None
    data_source_other: Optional[str] = None
    retention_value: Optional[int] = None
    retention_unit: Optional[str] = None
    storage_methods_other: Optional[str] = None
    access_condition: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 5 – ฐานทางกฎหมายและการส่งต่อ
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_company: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None

    # Section 6 – มาตรการรักษาความมั่นคงปลอดภัย (TOMs)
    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None


# =============================================================================
# Processor Section Full Read
# =============================================================================

class ProcessorSectionFullRead(BaseModel):
    """
    Response ครบทุก field สำหรับหน้ากรอกฟอร์ม Data Processor
    รวม sub-tables ทั้งหมด และ do_suggestion (คำแนะนำจาก DO)
    """
    id: UUID
    document_id: UUID
    processor_id: int
    status: RopaSectionEnum
    is_sent: bool
    updated_at: datetime

    # คำแนะนำจาก Data Owner (read-only สำหรับ DP)
    do_suggestion: Optional[str] = None

    # Section 1
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    # Section 2
    processor_name: Optional[str] = None
    controller_name: Optional[str] = None
    controller_address: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose_of_processing: Optional[str] = None

    # Section 4 (sub-tables)
    personal_data_items: List[PersonalDataItemOut] = []
    data_categories: List[DataCategoryOut] = []
    data_types: List[DataTypeOut] = []
    collection_methods: List[CollectionMethodOut] = []
    data_sources: List[DataSourceOut] = []

    # Section 5
    storage_types: List[StorageTypeOut] = []
    storage_methods: List[StorageMethodOut] = []
    data_source_other: Optional[str] = None
    retention_value: Optional[int] = None
    retention_unit: Optional[str] = None
    storage_methods_other: Optional[str] = None
    access_condition: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 6
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_company: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None

    # Section 6
    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None

    feedbacks: List[FeedbackRead] = []

    model_config = {"from_attributes": True}


# =============================================================================
# Processor Table Row (GET /processor/tables/assigned)
# =============================================================================

class ProcessorAssignedTableItem(BaseModel):
    """
    แถวในตาราง "เอกสารที่ดำเนินการ" ของ Data Processor
    แสดงทุกเอกสารที่ถูก assign ไม่ว่า DRAFT หรือ SUBMITTED
    แสดง: เลขเอกสาร, ชื่อผู้รับผิดชอบข้อมูล (DO name), วันที่ได้รับ,
           วันกำหนดส่ง, badge สถานะ DP, actions (ดู, ส่งให้ DO)
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    do_name: Optional[str]              # ชื่อ DO ที่สร้างเอกสาร
    processor_section_id: Optional[UUID]
    processor_section_status: Optional[RopaSectionEnum]
    assignment_status: AssignmentStatusEnum
    due_date: Optional[datetime]
    received_at: Optional[datetime]     # วันที่ได้รับ = created_at ของ assignment
    is_sent: bool
    owner_title: Optional[str] = None   # คำนำหน้าชื่อ DO
    owner_first_name: Optional[str] = None
    owner_last_name: Optional[str] = None
    status: ProcessorStatusBadge        # badge สถานะ DP เอง
    has_open_feedback: bool
    created_at: datetime

class ProcessorDraftTableItem(BaseModel):
    """
    แถวในตาราง "ฉบับร่าง" ของ Data Processor
    (เฉพาะเอกสารที่ processor_section.status = DRAFT — แสดงซ้ำจากตารางดำเนินการ)
    แสดง: ชื่อเอกสาร, บันทึกล่าสุด, actions (แก้ไข, ลบ)
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    processor_section_id: Optional[UUID]
    last_saved_at: Optional[datetime]   # updated_at ของ processor_section


class ProcessorAssignedTableResponse(BaseModel):
    """Response สำหรับ GET /processor/tables/assigned — แยก 2 กลุ่ม"""
    active: List[ProcessorAssignedTableItem]
    drafts: List[ProcessorDraftTableItem]


class MessageResponse(BaseModel):
    """Response สำหรับ endpoint ที่ส่งกลับแค่ข้อความ"""
    message: str


class DpoCommentForDpRead(BaseModel):
    """
    Comment จาก DPO ที่ส่งมาถึง DP (DP_SEC_*)
    แยกออกจาก FeedbackRead เพราะมาจาก dpo_section_comments คนละ table
    """
    section_key: str        # เช่น DP_SEC_1, DP_SEC_2
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ProcessorFeedbackResponse(BaseModel):
    """Response รวม feedback ที่ DP ได้รับจากทั้ง DO และ DPO"""
    from_do: List[FeedbackRead]         # feedback จาก DO (ReviewFeedbackModel)
    from_dpo: List[DpoCommentForDpRead] # comment จาก DPO (DpoSectionCommentModel)


# =============================================================================
# Snapshots (Drafts)
# =============================================================================

class ProcessorSnapshotRead(BaseModel):
    """ข้อมูลฉบับร่าง (Snapshot) แบบเต็ม"""
    id: UUID
    document_id: UUID
    document_number: Optional[str] = None
    title: Optional[str] = None
    data: dict
    created_at: datetime
    model_config = {"from_attributes": True}

class ProcessorSnapshotTableItem(BaseModel):
    """รายชื่อในตารางฉบับร่าง (Snapshot)"""
    id: UUID
    document_id: UUID
    document_number: Optional[str] = None
    title: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}



