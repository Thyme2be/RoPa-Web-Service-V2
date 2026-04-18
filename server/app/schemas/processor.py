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
)


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
      Section 6 (มาตรการรักษาความมั่นคงปลอดภัย TOMs): org_measures, access_control_measures, ...
    """

    # Section 1 – ผู้บันทึก (ข้อมูลส่วนตัว DP)
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    # Section 2 – ข้อมูล Processor
    processor_name: Optional[str] = None
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
    access_policy: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 5 – ฐานทางกฎหมายและการส่งต่อ
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_in_group: Optional[str] = None
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
    access_policy: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 6
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_in_group: Optional[str] = None
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

    model_config = {"from_attributes": True}


# =============================================================================
# Processor Table Row (GET /processor/tables/assigned)
# =============================================================================

class ProcessorStatusBadge(BaseModel):
    """badge แสดงสถานะในตารางของ DP"""
    label: str
    code: str

class ProcessorAssignedTableItem(BaseModel):
    """
    แถวในตารางเอกสารของ Data Processor
    แสดง: เลขเอกสาร, ชื่อ, สถานะ Owner Section, สถานะ Processor Section,
           วันกำหนดส่ง, icon actions (👁️ view, ✈️ ส่งให้ DO/DPO)
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    processor_company: Optional[str]
    # สถานะ section ของ DP เอง
    processor_section_id: Optional[UUID]
    processor_section_status: Optional[RopaSectionEnum]
    # สถานะ assignment ของ DP
    assignment_status: AssignmentStatusEnum
    due_date: Optional[datetime]
    # แสดงว่าเอกสารนี้ DO submit section แล้วหรือยัง (DP จะรู้ว่า DO เสร็จแล้ว)
    owner_section_submitted: bool
    # แสดงว่ามี feedback จาก DO/DPO ที่ยังไม่ได้แก้ไขหรือไม่
    has_open_feedback: bool
    created_at: datetime


