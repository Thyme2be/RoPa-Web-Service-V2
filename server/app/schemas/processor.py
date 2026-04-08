from pydantic import BaseModel       # Base class ของทุก Schema — ใช้ validate ข้อมูล
from typing import Optional, List    # Optional = อาจเป็น None ได้, List = array
from uuid import UUID                # ประเภทข้อมูล UUID
from datetime import datetime        # ประเภทข้อมูลวันที่และเวลา


# ══════════════════════════════════════════════════════
# FORM DATA — ข้อมูลฟอร์ม 6 ส่วน
# ใช้กับ 2 endpoint:
#   PUT /assignments/{id}/save-draft  (บันทึกฉบับร่าง)
#   PUT /assignments/{id}/confirm     (ยืนยันข้อมูล RoPA)
# ══════════════════════════════════════════════════════

class ProcessorFormData(BaseModel):
    """
    รับข้อมูลจาก Frontend ตอนกรอกฟอร์ม 6 ส่วน
    ทุก field เป็น Optional เพราะ save-draft ไม่ต้องกรอกครบ
    """

    # ── Section 1: รายละเอียดของผู้บันทึก RoPA ──
    title_prefix: Optional[str] = None         # คำนำหน้า (นาย/นาง/นางสาว)
    first_name: Optional[str] = None           # ชื่อจริง *required ตอน confirm
    last_name: Optional[str] = None            # นามสกุล *required ตอน confirm
    address: Optional[str] = None              # ที่อยู่สำนักงาน/หน่วยงาน *required
    email: Optional[str] = None                # อีเมล *required
    phone: Optional[str] = None                # เบอร์โทรศัพท์ *required

    # ── Section 2: รายละเอียดกิจกรรม ──
    processor_name: Optional[str] = None       # ชื่อผู้ประมวลผลข้อมูลส่วนบุคคล *required
    data_controller_address: Optional[str] = None  # ที่อยู่ผู้ควบคุมข้อมูลส่วนบุคคล *required
    processing_activity: Optional[str] = None  # กิจกรรมประมวลผล *required
    purpose: Optional[str] = None              # วัตถุประสงค์ของการประมวลผล *required

    # ── Section 3: ข้อมูลที่จัดเก็บ ──
    personal_data: Optional[List[str]] = None
    # ข้อมูลส่วนบุคคลที่จัดเก็บ — multi-select dropdown
    # Frontend ส่งมาเป็น array: ["ชื่อ-นามสกุล", "เบอร์โทร"]
    # Router จะแปลงเป็น JSON string ก่อนเก็บลง DB *required

    data_category: Optional[List[str]] = None
    # หมวดหมู่ข้อมูล — checkboxes (ลูกค้า/คู่ค้า/ผู้ติดต่อ/พนักงาน)
    # Frontend ส่งมาเป็น array: ["ลูกค้า", "พนักงาน"]
    # Router จะแปลงเป็น JSON string ก่อนเก็บลง DB *required

    data_type: Optional[str] = None
    # ประเภทข้อมูล — radio button
    # ค่าที่รับได้: "general" (ทั่วไป) หรือ "sensitive" (อ่อนไหว) *required

    # ── Section 4: การได้มาและการเก็บรักษา ──
    collection_method: Optional[str] = None
    # วิธีได้มาซึ่งข้อมูล — radio button
    # ค่าที่รับได้: "electronic" หรือ "document" *required

    data_source: Optional[str] = None
    # แหล่งที่ได้ข้อมูล — radio button
    # ค่าที่รับได้: "from_owner" (จากเจ้าของโดยตรง) หรือ "from_other" *required

    retention_storage_type: Optional[List[str]] = None
    # ประเภทการจัดเก็บ — checkboxes
    # Frontend ส่งมาเป็น array: ["electronic", "document"] *required

    retention_method: Optional[List[str]] = None
    # วิธีเก็บรักษา — multi-select dropdown
    # Frontend ส่งมาเป็น array *required

    retention_duration: Optional[str] = None   # ระยะเวลาเก็บรักษา เช่น "5" *required
    retention_duration_unit: Optional[str] = None  # หน่วย: "year" หรือ "month" *required
    retention_access_condition: Optional[str] = None   # สิทธิและวิธีการเข้าถึง *required
    retention_deletion_method: Optional[str] = None    # วิธีการลบหรือทำลาย *required

    # ── Section 5: ฐานทางกฎหมายและการส่งต่อ ──
    legal_basis: Optional[str] = None          # ฐานในการประมวลผล *required

    transfer_is_transfer: Optional[bool] = None
    # ส่งหรือโอนข้อมูลไปต่างประเทศไหม — radio (มี/ไม่มี)
    # ถ้า true → fields ด้านล่างกลายเป็น required

    transfer_country: Optional[str] = None         # ประเทศปลายทาง (required ถ้า transfer=true)
    transfer_is_in_group: Optional[bool] = None     # ส่งไปในกลุ่มบริษัทเครือไหม
    transfer_company_name: Optional[str] = None     # ชื่อบริษัท (ถ้าอยู่ในกลุ่ม)
    transfer_method: Optional[str] = None           # วิธีการโอน (required ถ้า transfer=true)
    transfer_protection_std: Optional[str] = None   # มาตรฐานคุ้มครอง (required ถ้า transfer=true)
    transfer_exception: Optional[str] = None        # ข้อยกเว้นมาตรา 28 (required ถ้า transfer=true)

    # ── Section 6: มาตรการรักษาความมั่นคงปลอดภัย (TOMs) ──
    security_organizational: Optional[str] = None  # มาตรการเชิงองค์กร
    security_access_control: Optional[str] = None  # การควบคุมการเข้าถึงข้อมูล
    security_technical: Optional[str] = None       # มาตรการเชิงเทคนิค
    security_responsibility: Optional[str] = None  # การกำหนดหน้าที่ความรับผิดชอบ
    security_physical: Optional[str] = None        # มาตรการทางกายภาพ
    security_audit: Optional[str] = None           # มาตรการตรวจสอบย้อนหลัง


# ══════════════════════════════════════════════════════
# SIDEBAR 1: รายการ RoPA
# ══════════════════════════════════════════════════════

class AssignmentStats(BaseModel):
    """
    กล่องตัวเลข 4 ใบ ด้านบนของ sidebar 1
    ┌──────────┬─────────────┬──────────────────┬──────────┐
    │งานทั้งหมด│ รอดำเนินการ │แก้ไขตาม FEEDBACK │ส่งงานแล้ว│
    │    12    │      5      │        3         │    4     │
    └──────────┴─────────────┴──────────────────┴──────────┘
    """
    total: int          # งานทั้งหมด = นับทุก status รวมกัน
    in_progress: int    # รอดำเนินการ = PENDING + IN_PROGRESS + CONFIRMED
    needs_revision: int # แก้ไขตาม FEEDBACK = NEEDS_REVISION
    submitted: int      # ส่งงานแล้ว = SUBMITTED


class AssignmentListItem(BaseModel):
    """
    1 แถวในตาราง sidebar 1
    ─────────────────────────────────────────────────────
    รหัสเอกสาร │ ชื่อรายการ │ ผู้มอบหมาย │ วันที่ได้รับ │ สถานะ │ ดำเนินการ
    ─────────────────────────────────────────────────────
    """
    id: UUID                        # id ของ ProcessorRecord — ใช้ตอนกดปุ่ม "แก้ไข"
    doc_code: Optional[str] = None  # รหัสเอกสาร เช่น "RP-2026-1000" — แสดงในคอลัมน์แรก
    title: str                      # ชื่อรายการ — แสดงในคอลัมน์ที่ 2
    assigned_by: Optional[str] = None  # ชื่อ Data Owner ที่มอบหมาย — แสดงในคอลัมน์ผู้มอบหมาย
    received_at: datetime           # วันที่ได้รับมอบหมาย (created_at ของ record)
    processor_status: str           # ค่า status จริงใน DB เช่น "submitted" — ใช้ใน logic
    status_display: str             # ค่าที่แสดงบนหน้าจอ เช่น "ส่งงานแล้ว" — แสดง badge
    can_edit: bool                  # กดแก้ไขได้ไหม — ถ้า false ซ่อนหรือ disable ปุ่มแก้ไข

    model_config = {"from_attributes": True}
    # บอก Pydantic ให้อ่านค่าจาก SQLAlchemy object ได้โดยตรง (ไม่ต้องแปลงเป็น dict)


class AssignmentListResponse(BaseModel):
    """
    Response ทั้งหมดของ GET /processor/assignments
    ครอบ AssignmentStats + list ของ AssignmentListItem + ข้อมูล pagination
    """
    stats: AssignmentStats              # กล่อง 4 ใบด้านบน
    records: List[AssignmentListItem]   # แถวทั้งหมดในตาราง (เฉพาะหน้าปัจจุบัน)
    total: int      # จำนวนรายการทั้งหมด (ใช้คำนวณจำนวนหน้า)
    page: int       # หน้าปัจจุบัน
    page_size: int  # จำนวนแถวต่อหน้า


class ReadyToSendItem(BaseModel):
    """
    1 แถวใน modal "รายการที่ต้องการส่งเฉพาะฉบับที่เสร็จสมบูรณ์"
    เปิดเมื่อกดปุ่ม "เลือกรายการ" (สีแดง) ใน sidebar 1
    แสดงเฉพาะ records ที่ status = CONFIRMED (กรอกครบ+ยืนยันแล้ว รอส่ง)
    ────────────────────────────────────────────────
    รหัสเอกสาร │ ชื่อรายการ │ วันที่สร้าง │ [เลือกเอกสาร]
    ────────────────────────────────────────────────
    """
    id: UUID                        # id ของ ProcessorRecord — ใช้ตอนกดปุ่ม "เลือกเอกสาร"
    doc_code: Optional[str] = None  # รหัสเอกสาร
    title: str                      # ชื่อรายการ
    created_at: datetime            # วันที่สร้าง (ของ RopaDocument)

    model_config = {"from_attributes": True}


class ReadyToSendResponse(BaseModel):
    """Response ของ GET /processor/ready-to-send (ข้อมูลทั้งหมดใน modal)"""
    records: List[ReadyToSendItem]  # รายการใน modal
    total: int      # จำนวนทั้งหมด
    page: int       # หน้าปัจจุบัน
    page_size: int  # จำนวนต่อหน้า


# ══════════════════════════════════════════════════════
# SIDEBAR 2: เอกสาร
# ══════════════════════════════════════════════════════

class DocumentStats(BaseModel):
    """
    กล่องตัวเลข 2 ใบ ด้านบนของ sidebar 2
    ┌──────────────────────┬─────────────────────┐
    │ จำนวนเอกสารทั้งหมด   │  เอกสารฉบับสมบูรณ์  │
    │        96            │         84          │
    └──────────────────────┴─────────────────────┘
    """
    total: int      # จำนวนเอกสารทั้งหมดที่อยู่ในกระบวนการตรวจ (Auditor)
    complete: int   # เอกสารที่ Auditor อนุมัติแล้ว (audit_status = APPROVED)


class ActiveDocumentItem(BaseModel):
    """
    1 แถวในตาราง "รายการที่ดำเนินการ" ของ sidebar 2
    แสดงเอกสารที่ Data Owner ส่งให้ Auditor แล้ว
    ────────────────────────────────────────────────────────────────
    รหัสเอกสาร │ ชื่อรายการ │ วันที่ส่งข้อมูล │ สถานะ      │ ดูเอกสาร
    ────────────────────────────────────────────────────────────────
    """
    id: UUID                        # id ของ ProcessorRecord — ใช้ตอนกดปุ่ม "ดูเอกสาร"
    doc_code: Optional[str] = None  # รหัสเอกสาร
    title: str                      # ชื่อรายการ
    sent_at: Optional[datetime] = None  # วันที่ส่งให้ Data Owner (sent_to_owner_at)
    audit_status: Optional[str] = None  # ค่า status จริง เช่น "approved" — ใช้ใน logic
    audit_status_display: str       # ค่าที่แสดงบนหน้าจอ: "อนุมัติ"/"รอตรวจสอบ"/"ต้องแก้ไข"
    can_edit: bool
    # กดแก้ไขได้ไหม — true เฉพาะเมื่อ audit_status = needs_revision
    # ถ้า true → กดดูเอกสารแล้วแก้ไขได้, ถ้า false → read-only

    model_config = {"from_attributes": True}


class DraftItem(BaseModel):
    """
    1 แถวในตาราง "ฉบับร่าง" ของ sidebar 2
    แสดงเอกสารที่ Data Processor กด "บันทึกฉบับร่าง" ค้างไว้
    (processor_status = IN_PROGRESS และมี draft_code)
    ────────────────────────────────────────────────────
    รหัสฉบับร่าง │ ชื่อรายการ │ บันทึกล่าสุด │ ✏แก้ไข  🗑ลบ
    ────────────────────────────────────────────────────
    """
    id: UUID                        # id ของ ProcessorRecord
                                    # → ปุ่ม "แก้ไข": GET /assignments/{id}
                                    # → ปุ่ม "ลบ": DELETE /drafts/{id}
    draft_code: Optional[str] = None  # รหัสฉบับร่าง เช่น "DFT-5525"
    title: str                      # ชื่อรายการ (จาก RopaDocument.title)
    updated_at: datetime            # บันทึกล่าสุด — แสดงในคอลัมน์ "บันทึกล่าสุด"

    model_config = {"from_attributes": True}


class DocumentsPageResponse(BaseModel):
    """
    Response ทั้งหมดของ GET /processor/documents
    ครอบทุกอย่างในหน้า sidebar 2
    """
    stats: DocumentStats                    # กล่อง 2 ใบด้านบน
    active_records: List[ActiveDocumentItem]  # ตาราง "รายการที่ดำเนินการ"
    active_total: int       # จำนวนรายการในตาราง active (ทั้งหมด ไม่ใช่แค่หน้านี้)
    active_page: int        # หน้าปัจจุบันของตาราง active
    drafts: List[DraftItem] # ตาราง "ฉบับร่าง"
    drafts_total: int       # จำนวนฉบับร่างทั้งหมด
    drafts_page: int        # หน้าปัจจุบันของตาราง drafts
    page_size: int          # จำนวนแถวต่อหน้า (ใช้กับทั้งสองตาราง)


# ══════════════════════════════════════════════════════
# SIDEBAR 3: ข้อเสนอแนะ
# ══════════════════════════════════════════════════════

class FeedbackListItem(BaseModel):
    """
    1 แถวในตาราง sidebar 3 หน้าแรก (รายการ feedback)
    แสดงเฉพาะ AuditorAudit ที่มี processor_feedback และ audit_status = NEEDS_REVISION
    ──────────────────────────────────────────────────────────────────
    รหัสเอกสาร │ ชื่อรายการ │ วันที่ส่ง │ วันที่ได้รับ │ ดูข้อเสนอแนะ
    ──────────────────────────────────────────────────────────────────
    """
    audit_id: UUID                      # id ของ AuditorAudit — ใช้ตอนกดปุ่ม "ดูข้อเสนอแนะ"
    doc_code: Optional[str] = None      # รหัสเอกสาร
    title: str                          # ชื่อรายการ
    sent_at: Optional[datetime] = None      # วันที่ Auditor ส่ง feedback (request_change_at)
    received_at: Optional[datetime] = None  # วันที่ได้รับ (ปัจจุบันใช้ค่าเดียวกับ sent_at)

    model_config = {"from_attributes": True}


class FeedbackListResponse(BaseModel):
    """Response ทั้งหมดของ GET /processor/feedback (หน้ารายการ)"""
    feedbacks: List[FeedbackListItem]   # แถวทั้งหมดในตาราง
    total: int      # จำนวนทั้งหมด
    page: int       # หน้าปัจจุบัน
    page_size: int  # จำนวนต่อหน้า


class AssignmentFormResponse(BaseModel):
    """
    Response ของ GET /processor/assignments/{record_id}
    ใช้ร่วมกันทุก sidebar — Swagger จะแสดง schema นี้
    `is_read_only` บอก frontend ว่าให้ disable input ไหม
    """
    # ── metadata ──
    id: UUID
    doc_code: Optional[str] = None
    title: str
    processor_status: str
    draft_code: Optional[str] = None
    assigned_by: Optional[str] = None
    received_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    sent_to_owner_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    audit_status: Optional[str] = None
    audit_status_display: Optional[str] = None
    is_read_only: bool
    # ── Section 1 ──
    title_prefix: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    # ── Section 2 ──
    processor_name: Optional[str] = None
    data_controller_address: Optional[str] = None
    processing_activity: Optional[str] = None
    purpose: Optional[str] = None
    # ── Section 3 ──
    personal_data: Optional[List[str]] = None
    data_category: Optional[List[str]] = None
    data_type: Optional[str] = None
    # ── Section 4 ──
    collection_method: Optional[str] = None
    data_source: Optional[str] = None
    retention_storage_type: Optional[List[str]] = None
    retention_method: Optional[List[str]] = None
    retention_duration: Optional[str] = None
    retention_duration_unit: Optional[str] = None
    retention_access_condition: Optional[str] = None
    retention_deletion_method: Optional[str] = None
    # ── Section 5 ──
    legal_basis: Optional[str] = None
    transfer_is_transfer: Optional[bool] = None
    transfer_country: Optional[str] = None
    transfer_is_in_group: Optional[bool] = None
    transfer_company_name: Optional[str] = None
    transfer_method: Optional[str] = None
    transfer_protection_std: Optional[str] = None
    transfer_exception: Optional[str] = None
    # ── Section 6 ──
    security_organizational: Optional[str] = None
    security_access_control: Optional[str] = None
    security_technical: Optional[str] = None
    security_responsibility: Optional[str] = None
    security_physical: Optional[str] = None
    security_audit: Optional[str] = None

    model_config = {"from_attributes": True}


class SectionFeedback(BaseModel):
    """
    1 กล่อง comment จาก Auditor — แสดงแยกตามส่วนของฟอร์ม
    ตัวอย่างใน UI:
    ┌──────────────────────────────────────────────────────┐
    │  ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ              │ ← section_label
    │  "กรุณาให้ผู้ประมวลผลข้อมูลส่วนบุคคล ยืนยันว่า..."  │ ← comment
    └──────────────────────────────────────────────────────┘
    """
    section: str        # key ของส่วน เช่น "section_5" — ใช้ใน logic ฝั่ง frontend
    section_label: str  # ชื่อส่วนที่แสดง เช่น "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ"
    comment: str        # ข้อความ feedback จาก Auditor


class FeedbackDetailResponse(BaseModel):
    """
    Response ของ GET /processor/feedback/{audit_id} (หน้า detail)
    แสดงหลังกดปุ่ม "ดูข้อเสนอแนะ"
    ────────────────────────────────────────────────────────
    รหัสเอกสาร: ROPA-2026-1000    วันที่แก้ไขล่าสุด: 31/03/2026
    ผู้ตรวจสอบ: วิริยา พรหมรักษ์           [ประวัติการแก้ไข]

    ข้อเสนอแนะสำหรับผู้ประมวลผลข้อมูลส่วนบุคคล  [✏แก้ไขเอกสาร]
    [กล่อง section feedback แต่ละกล่อง]
    ────────────────────────────────────────────────────────
    """
    audit_id: UUID                          # id ของ AuditorAudit
    doc_code: Optional[str] = None          # รหัสเอกสาร — แสดงบนสุด
    title: str                              # ชื่อรายการ
    last_modified: Optional[datetime] = None  # วันที่แก้ไขล่าสุด (updated_at หรือ request_change_at)
    auditor_name: Optional[str] = None      # ชื่อ Auditor เช่น "วิริยา พรหมรักษ์"
    section_feedbacks: List[SectionFeedback]  # กล่อง comment ทุกกล่อง (แยกตามส่วน)
    processor_record_id: Optional[UUID] = None
    # id ของ ProcessorRecord ที่เกี่ยวข้อง
    # Frontend ใช้ตอนกดปุ่ม "แก้ไขเอกสาร"
    # → redirect ไป GET /assignments/{processor_record_id}

    model_config = {"from_attributes": True}
