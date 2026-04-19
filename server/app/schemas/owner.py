"""
owner.py ─ Pydantic schemas สำหรับ Data Owner

ครอบคลุมทุกหน้าที่ Data Owner ใช้งาน:
  - สร้างเอกสาร
  - กรอก/บันทึก Owner Section
  - ตาราง 4 ประเภท (Active, Sent-to-DPO, Approved, Destroyed)
  - Dashboard
  - Risk Assessment
  - Deletion Request
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.enums import (
    DocumentStatusEnum,
    DeletionStatusEnum,
    DeletionRequestStatusEnum,
    RopaSectionEnum,
    RiskLevelEnum,
    FeedbackTargetEnum,
    ReviewStatusEnum,
    ReviewAssignmentStatusEnum,
)


# =============================================================================
# Sub-table items (สำหรับ Section ที่มี list)
# =============================================================================

class PersonalDataItemIn(BaseModel):
    """ข้อมูลส่วนบุคคล (Section 4) เช่น ชื่อ, เบอร์โทร"""
    type: Optional[str] = None
    other_description: Optional[str] = None

class PersonalDataItemOut(PersonalDataItemIn):
    id: UUID
    model_config = {"from_attributes": True}

class DataCategoryIn(BaseModel):
    """หมวดหมู่ข้อมูล เช่น ข้อมูลสุขภาพ, ข้อมูลการเงิน"""
    category: Optional[str] = None

class DataCategoryOut(DataCategoryIn):
    id: UUID
    model_config = {"from_attributes": True}

class DataTypeIn(BaseModel):
    """ประเภทข้อมูล พร้อมระบุว่าเป็นข้อมูลทั่วไปหรือข้อมูลอ่อนไหว"""
    type: Optional[str] = None

class DataTypeOut(DataTypeIn):
    id: UUID
    model_config = {"from_attributes": True}

class CollectionMethodIn(BaseModel):
    """วิธีการเก็บรวบรวม เช่น แบบฟอร์มออนไลน์, เอกสารกระดาษ"""
    method: Optional[str] = None

class CollectionMethodOut(CollectionMethodIn):
    id: UUID
    model_config = {"from_attributes": True}

class DataSourceIn(BaseModel):
    """แหล่งที่มาของข้อมูล"""
    source: Optional[str] = None
    other_description: Optional[str] = None

class DataSourceOut(DataSourceIn):
    id: UUID
    model_config = {"from_attributes": True}

class StorageTypeIn(BaseModel):
    """ประเภทการจัดเก็บ เช่น Cloud, On-Premise"""
    type: Optional[str] = None

class StorageTypeOut(StorageTypeIn):
    id: UUID
    model_config = {"from_attributes": True}

class StorageMethodIn(BaseModel):
    """วิธีการจัดเก็บ"""
    method: Optional[str] = None
    other_description: Optional[str] = None

class StorageMethodOut(StorageMethodIn):
    id: UUID
    model_config = {"from_attributes": True}



# =============================================================================
# Document Create (POST /owner/documents)
# =============================================================================

class DocumentCreateOwner(BaseModel):
    """
    Payload สำหรับสร้างเอกสารใหม่โดย Data Owner
    - หน้า: Modal "สร้างเอกสาร"
    - กด "สร้าง" → สร้าง ropa_documents + ropa_owner_sections + processor_assignments
    """
    title: str
    description: Optional[str] = None
    review_interval_days: int = 365
    due_date: Optional[datetime] = None
    processor_company: Optional[str] = None
    # DP user ที่ถูก assign ให้กรอก Processor Section
    assigned_processor_id: int


# =============================================================================
# Owner Section Save/Submit (PATCH/POST /owner/documents/{id}/section)
# =============================================================================

class OwnerSectionSave(BaseModel):
    """
    Payload สำหรับบันทึกฉบับร่าง (บันทึกฉบับร่าง) หรือบันทึกสมบูรณ์ (บันทึก)
    ทุก field เป็น Optional เพราะ DO สามารถบันทึกแค่บางส่วนก็ได้

    Sections ใน UI:
      Section 1 (ผู้บันทึก): title_prefix, first_name, last_name, address, email, phone
      Section 2 (ช่องทางติดต่อ): contact_email, company_phone
      Section 3 (ข้อมูลกิจกรรม): data_owner_name, processing_activity, purpose_of_processing
      Section 4 (ข้อมูลส่วนบุคคล): personal_data_items, data_categories, data_types,
                                     collection_methods, data_sources
      Section 5 (การจัดเก็บ): storage_types, storage_methods, data_source_other,
                               retention_value, retention_unit, access_control_policy, deletion_method
      Section 6 (สิทธิ์/ความยินยอม): legal_basis, has_cross_border_transfer, ...
      Section 7 (มาตรการ TOMs): org_measures, access_control_measures, ...
    """

    # Section 1 – ผู้บันทึก (ข้อมูลส่วนตัว DO)
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    # Section 2 – ช่องทางติดต่อบริษัท
    contact_email: Optional[str] = None
    company_phone: Optional[str] = None

    # Section 3 – ข้อมูลกิจกรรมการประมวลผล
    data_owner_name: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose_of_processing: Optional[str] = None

    # Section 4 – ข้อมูลส่วนบุคคล (sub-tables)
    personal_data_items: Optional[List[PersonalDataItemIn]] = None
    data_categories: Optional[List[DataCategoryIn]] = None
    data_types: Optional[List[DataTypeIn]] = None
    collection_methods: Optional[List[CollectionMethodIn]] = None
    data_sources: Optional[List[DataSourceIn]] = None

    # Section 5 – การจัดเก็บข้อมูล
    storage_types: Optional[List[StorageTypeIn]] = None
    storage_methods: Optional[List[StorageMethodIn]] = None
    data_source_other: Optional[str] = None
    retention_value: Optional[int] = None
    retention_unit: Optional[str] = None
    access_control_policy: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 6 – ฐานทางกฎหมาย / การส่งข้อมูลข้ามพรมแดน / ความยินยอมผู้เยาว์
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_in_group: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None
    exemption_usage: Optional[str] = None
    refusal_handling: Optional[str] = None
    # ความยินยอมผู้เยาว์ = list ของ string ตรงกับ 3 checkbox ใน UI
    # เช่น ["UNDER_10", "10_TO_20"] หรือ ["NONE"]
    minor_consent_types: Optional[List[str]] = None

    # Section 7 – มาตรการรักษาความปลอดภัย (TOMs)
    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None


# =============================================================================
# Owner Section Full Read (GET /owner/documents/{id}/section)
# =============================================================================

class OwnerSectionFullRead(BaseModel):
    """
    Response ครบทุก field สำหรับหน้ากรอกฟอร์ม Data Owner
    รวม sub-tables ทั้งหมด
    """
    id: UUID
    document_id: UUID
    owner_id: int
    status: RopaSectionEnum
    updated_at: datetime

    # Section 1
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    # Section 2
    contact_email: Optional[str] = None
    company_phone: Optional[str] = None

    # Section 3
    data_owner_name: Optional[str] = None
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
    access_control_policy: Optional[str] = None
    deletion_method: Optional[str] = None

    # Section 6
    legal_basis: Optional[str] = None
    has_cross_border_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_in_group: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_standard: Optional[str] = None
    transfer_exception: Optional[str] = None
    exemption_usage: Optional[str] = None
    refusal_handling: Optional[str] = None
    # ความยินยอมผู้เยาว์ (ตรงกับ 3 checkbox ใน UI)
    minor_consent_types: List[str] = []

    # Section 7
    org_measures: Optional[str] = None
    access_control_measures: Optional[str] = None
    technical_measures: Optional[str] = None
    responsibility_measures: Optional[str] = None
    physical_measures: Optional[str] = None
    audit_measures: Optional[str] = None

    model_config = {"from_attributes": True}


# =============================================================================
# Risk Assessment (POST /owner/documents/{id}/risk)
# =============================================================================

class RiskAssessmentSubmit(BaseModel):
    """
    Payload ส่ง Risk Assessment
    - likelihood และ impact คือ 1-5
    - risk_score คำนวณจาก likelihood × impact
    - risk_level: LOW(<8) / MEDIUM(8-14) / HIGH(>=15)
    """
    likelihood: int = Field(..., ge=1, le=5)
    impact: int = Field(..., ge=1, le=5)

class RiskAssessmentRead(BaseModel):
    id: UUID
    document_id: UUID
    assessed_by: int
    likelihood: Optional[int]
    impact: Optional[int]
    risk_score: Optional[int]
    risk_level: Optional[RiskLevelEnum]
    assessed_at: datetime
    model_config = {"from_attributes": True}


# =============================================================================
# Deletion Request (POST /owner/documents/{id}/deletion)
# =============================================================================

class DeletionRequestCreate(BaseModel):
    """
    Payload ยื่นคำร้องขอทำลายเอกสาร
    - หน้า: "ยื่นคำร้องขอทำลาย" (เข้าถึงได้จากปุ่ม ส่ง/ลบ ในทุกตาราง)
    - ต้องระบุเหตุผลในการขอทำลาย
    """
    owner_reason: str

class DeletionRequestRead(BaseModel):
    id: UUID
    document_id: UUID
    requested_by: int
    owner_reason: str
    dpo_id: Optional[int]
    dpo_decision: Optional[str]
    dpo_reason: Optional[str]
    status: DeletionRequestStatusEnum
    requested_at: datetime
    decided_at: Optional[datetime]
    model_config = {"from_attributes": True}


# =============================================================================
# do_suggestion update (PATCH /owner/documents/{id}/processor-section/suggestion)
# =============================================================================

class SendToDpoPayload(BaseModel):
    """Payload สำหรับ DO ส่งเอกสารให้ DPO review (ทั้ง send-to-dpo และ annual-review)"""
    dpo_id: int


class MessageResponse(BaseModel):
    """Response สำหรับ endpoint ที่ส่งกลับแค่ข้อความ"""
    message: str


class SendToDpoResponse(BaseModel):
    """Response สำหรับ send-to-dpo"""
    message: str
    document_number: str
    review_cycle_id: str


class AnnualReviewResponse(BaseModel):
    """Response สำหรับ annual-review"""
    message: str
    review_cycle_id: str


class DoSuggestionResponse(BaseModel):
    """Response สำหรับ update do_suggestion"""
    message: str
    do_suggestion: Optional[str]


class DoSuggestionUpdate(BaseModel):
    """DO เขียน/แก้ไขคำแนะนำสำหรับ DP (กรอกได้ตลอดเวลา)"""
    suggestion: Optional[str] = None


# =============================================================================
# Feedback Batch (POST /owner/documents/{id}/processor-section/feedback)
# =============================================================================

class SectionFeedbackItem(BaseModel):
    """
    รายการ feedback 1 หัวข้อ
    - section_number: section ที่ต้องแก้ไข (1-6 สำหรับ DP)
    - field_name: ชื่อ field ที่ต้องการให้แก้ไข (optional)
    - comment: คำอธิบายว่าต้องแก้ไขอะไร
    """
    section_number: int
    field_name: Optional[str] = None
    comment: str

class FeedbackBatch(BaseModel):
    """
    Payload สำหรับปุ่ม "ส่งคำร้องขอเปลี่ยนแปลง" ในหน้า Tab 2
    ส่ง feedback ทั้งหมดที่ DO stage ไว้ให้ DP ในครั้งเดียว
    """
    items: List[SectionFeedbackItem]

class FeedbackRead(BaseModel):
    id: UUID
    review_cycle_id: Optional[UUID]
    section_number: Optional[int]
    from_user_id: int
    to_user_id: int
    target_type: FeedbackTargetEnum
    target_id: UUID
    field_name: Optional[str]
    comment: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    model_config = {"from_attributes": True}


# =============================================================================
# Table Row Schemas (สำหรับตาราง 4 ประเภทของ Data Owner)
# =============================================================================

class OwnerStatusBadge(BaseModel):
    """badge แสดงสถานะของ Owner Section ในตาราง"""
    label: str   # ข้อความที่แสดง เช่น "รอส่วนของ Data Owner", "ดำเนินการเสร็จสิ้น"
    code: str    # code สำหรับ frontend เช่น "WAITING_DO", "DO_DONE", "NEEDS_FIX"

class ProcessorStatusBadge(BaseModel):
    """badge แสดงสถานะของ Processor Section ในตาราง"""
    label: str
    code: str


class ActiveTableItem(BaseModel):
    """
    ตาราง 1 – เอกสาร Active (status = IN_PROGRESS)
    แสดง: เลขเอกสาร, ชื่อ, DP name, สถานะ DO, สถานะ DP, วันกำหนดส่ง, icon actions
    """
    document_id: UUID
    document_number: Optional[str]         # DFT-YYYY-XX
    title: Optional[str]
    dp_name: Optional[str]                 # ชื่อ Data Processor ที่ถูก assign
    dp_company: Optional[str]              # บริษัทของ DP (processor_company)
    owner_status: OwnerStatusBadge
    processor_status: ProcessorStatusBadge
    due_date: Optional[datetime]
    created_at: datetime
    owner_section_id: Optional[UUID]
    owner_section_status: Optional[RopaSectionEnum]
    processor_section_id: Optional[UUID]
    processor_section_status: Optional[RopaSectionEnum]

class SentToDpoTableItem(BaseModel):
    """
    ตาราง 2 – เอกสารที่ส่ง DPO แล้ว (status = UNDER_REVIEW)
    ui_status 5 ค่า:
      WAITING_REVIEW  = รอตรวจสอบ (DO ส่งให้ DPO ตรวจ cycle.status=IN_REVIEW ไม่มี feedback)
      WAITING_DO_FIX  = รอ DO แก้ไข (DPO ส่ง feedback ให้ DO)
      WAITING_DP_FIX  = รอ DP แก้ไข (DPO ส่ง feedback ให้ DP)
      DO_DONE         = DO ดำเนินการเสร็จสิ้น (DO ส่งแก้ไขคืน DPO แล้ว)
      DP_DONE         = DP ดำเนินการเสร็จสิ้น (DP ส่งแก้ไขคืน DPO แล้ว)
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    dpo_name: Optional[str]
    ui_status: str
    ui_status_label: str
    sent_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    due_date: Optional[datetime]

class ApprovedTableItem(BaseModel):
    """
    ตาราง 3 – เอกสารที่ DPO อนุมัติแล้ว (status = COMPLETED)
    annual_review_status 2 ค่า:
      NOT_REVIEWED = ครบกำหนดแล้วแต่ยังไม่ส่งตรวจ (next_review_due_at <= now)
      REVIEWED     = ตรวจสอบเสร็จสิ้นแล้ว (ยังไม่ครบกำหนด หรือมี cycle APPROVED ในรอบนี้)
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    do_name: Optional[str]
    dpo_name: Optional[str]
    last_approved_at: Optional[datetime]
    next_review_due_at: Optional[datetime]
    destruction_date: Optional[datetime]
    annual_review_status: str              # NOT_REVIEWED | REVIEWED
    annual_review_status_label: str

class DestroyedTableItem(BaseModel):
    """
    ตาราง 4 – เอกสารที่ถูกทำลายแล้ว (deletion_status = DELETED)
    แสดง: เลขเอกสาร, ชื่อ DO, ชื่อ DPO, วันที่ DPO อนุมัติทำลาย
    """
    document_id: UUID
    document_number: Optional[str]
    title: Optional[str]
    do_name: Optional[str]                 # ชื่อ Data Owner ที่สร้างเอกสาร
    dpo_name: Optional[str]               # ชื่อ DPO ที่อนุมัติการทำลาย
    deletion_approved_at: Optional[datetime]   # วันที่ DPO อนุมัติ (decided_at)
    deletion_reason: Optional[str]


# =============================================================================
# Dashboard Response (GET /owner/dashboard)
# =============================================================================

class OwnerDashboardResponse(BaseModel):
    """
    หน้า Dashboard ของ Data Owner
    แสดง: card สรุปสถานะ, chart, และ quick action
    """
    # ── Card 1: จำนวนเอกสารทั้งหมด ──────────────────────────────────────
    total_documents: int

    # ── Card 2: เอกสารที่ต้องแก้ไขหลัง DPO ตรวจสอบ (แยก DO / DP) ────────
    needs_fix_do_count: int          # review_assignment role=OWNER, status=FIX_IN_PROGRESS
    needs_fix_dp_count: int          # review_assignment role=PROCESSOR, status=FIX_IN_PROGRESS

    # ── Card 3: ความเสี่ยงของเอกสารทั้งหมด (donut chart) ─────────────────
    risk_low_count: int              # risk_level = LOW
    risk_medium_count: int           # risk_level = MEDIUM
    risk_high_count: int             # risk_level = HIGH

    # ── Card 4: เอกสารรอ DPO ตรวจสอบ (แยก จัดเก็บ / ทำลาย) ─────────────
    under_review_storage_count: int  # UNDER_REVIEW ที่ไม่มี deletion pending
    under_review_deletion_count: int # deletion_status = DELETE_PENDING

    # ── Card 5: เอกสารที่รอดำเนินการ (แยก DO / DP ยังไม่ submit) ─────────
    pending_do_count: int            # IN_PROGRESS ที่ owner_section.status = DRAFT
    pending_dp_count: int            # IN_PROGRESS ที่ processor_section.status = DRAFT

    # ── Card 6: เอกสารที่ได้รับการอนุมัติ ─────────────────────────────────
    completed_count: int

    # ── Card 7: เอกสารประเภทข้อมูลอ่อนไหว ────────────────────────────────
    sensitive_document_count: int    # มีการระบุ data_categories ใน owner section

    # ── Card 8: เอกสารที่ DP ส่งช้าเกินกำหนด (IN_PROGRESS ที่เลย due_date แล้ว DP ยังไม่ submit) ──
    overdue_dp_count: int

    # ── Card 9: เอกสารที่ต้องเช็ครายปี (แยก ตรวจแล้ว / ยังไม่ตรวจ) ──────
    annual_reviewed_count: int       # COMPLETED ที่มี review cycle มากกว่า 1 รอบ
    annual_not_reviewed_count: int   # COMPLETED ที่ next_review_due_at <= now

    # ── Card 10: เอกสารที่ครบกำหนดทำลาย (รอยื่นคำร้อง) ──────────────────
    destruction_due_count: int       # COMPLETED ที่ retention หมดแล้ว ยัง deletion_status = NULL

    # ── Card 11: เอกสารที่ถูกทำลายแล้ว ───────────────────────────────────
    deleted_count: int
