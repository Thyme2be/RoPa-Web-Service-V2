import json                              # ใช้แปลง list ↔ JSON string สำหรับ field ที่เก็บเป็น Text ใน DB
from datetime import datetime, timedelta, timezone  # จัดการวันที่/เวลา และ timezone
from typing import Optional             # Optional = field ที่อาจเป็น None ได้
from uuid import UUID                   # ประเภทข้อมูล UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
# APIRouter   = สร้าง router สำหรับรวม endpoints
# Depends     = Dependency Injection (ใส่ db session / auth เข้า endpoint อัตโนมัติ)
# HTTPException = 던던 error response กลับ frontend เช่น 404, 403
# Query       = รับ query parameter จาก URL เช่น ?page=1
# status      = HTTP status code constants เช่น status.HTTP_422_UNPROCESSABLE_ENTITY

from sqlalchemy.orm import Session      # ประเภทของ database session
from sqlalchemy import func             # ใช้ฟังก์ชัน SQL เช่น COUNT()

from app.api.deps import get_db, RoleChecker
# get_db       = สร้าง DB session ใหม่ต่อ 1 request แล้วปิดเมื่อเสร็จ
# RoleChecker  = ตรวจสอบว่า user มี role ที่อนุญาตไหม

from app.models.document import (
    AuditStatus,        # enum: PENDING_REVIEW / APPROVED / NEEDS_REVISION
    AuditorAudit,       # model: บันทึกการตรวจของ Auditor
    DocumentStatus,     # enum: สถานะของ RopaDocument หลัก
    ProcessorRecord,    # model: ส่วนที่ Data Processor กรอก
    ProcessorStatus,    # enum: PENDING / IN_PROGRESS / CONFIRMED / SUBMITTED / NEEDS_REVISION
    RopaDocument,       # model: เอกสาร RoPA หลัก
)
from app.models.user import User        # model: ข้อมูล user

from app.schemas.processor import (
    ActiveDocumentItem,         # schema: 1 แถวในตาราง "รายการที่ดำเนินการ" sidebar 2
    AssignmentListItem,         # schema: 1 แถวในตาราง sidebar 1
    AssignmentListResponse,     # schema: response ทั้งหมดของ sidebar 1
    AssignmentStats,            # schema: กล่อง 4 ใบด้านบน sidebar 1
    DocumentStats,              # schema: กล่อง 2 ใบด้านบน sidebar 2
    DocumentsPageResponse,      # schema: response ทั้งหมดของ sidebar 2
    DraftItem,                  # schema: 1 แถวในตาราง "ฉบับร่าง" sidebar 2
    FeedbackDetailResponse,     # schema: response หน้า feedback detail sidebar 3
    FeedbackListItem,           # schema: 1 แถวในตาราง sidebar 3
    FeedbackListResponse,       # schema: response ทั้งหมดของ sidebar 3
    ProcessorFormData,          # schema: ข้อมูลฟอร์ม 6 ส่วน
    ReadyToSendItem,            # schema: 1 แถวใน modal เลือกรายการ
    ReadyToSendResponse,        # schema: response ทั้งหมดของ modal
    SectionFeedback,            # schema: 1 กล่อง comment จาก Auditor
)

router = APIRouter()
# สร้าง router — main.py จะ import แล้วลงทะเบียนด้วย prefix "/processor"

require_processor = RoleChecker(["Data Processor"])
# dependency ที่จะเช็คว่า user มี role "Data processor" ไหม
# ถ้าไม่ใช่ → 403 Forbidden อัตโนมัติ

# ── mapping section key → ชื่อแสดงบนหน้าจอ (ใช้ใน sidebar 1) ──
SECTION_LABELS = {
    "section_1": "ส่วนที่ 1 : รายละเอียดของผู้บันทึก RoPA",
    "section_2": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
    "section_3": "ส่วนที่ 3 : ข้อมูลที่จัดเก็บ",
    "section_4": "ส่วนที่ 4 : การได้มาและการเก็บรักษา",
    "section_5": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
    "section_6": "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)",
}


# ════════════════════════════════════════════════════════
# HELPER FUNCTIONS — ฟังก์ชันช่วยที่ใช้ซ้ำหลาย endpoint
# ════════════════════════════════════════════════════════

def get_doc_code(doc: RopaDocument) -> Optional[str]:
    """
    คืนรหัสเอกสารที่แสดงบนหน้าจอ
    ถ้า Data Owner ตั้งค่า doc_code แล้ว → ใช้ค่านั้น
    ถ้ายังไม่ตั้ง → สร้าง fallback จาก year + 4 ตัวแรกของ UUID
    """
    if doc.doc_code:
        return doc.doc_code
    year = doc.created_at.year if doc.created_at else datetime.now(timezone.utc).year
    return f"RP-{year}-{str(doc.id)[:4].upper()}"  # เช่น "RP-2026-3F2E"


def get_status_display(ps: ProcessorStatus) -> str:
    """
    แปลง ProcessorStatus (ภาษาอังกฤษ) → ข้อความแสดงบนหน้าจอ (ภาษาไทย)
    PENDING / IN_PROGRESS / CONFIRMED → "กำลังดำเนินการ" (badge เดียวกัน)
    SUBMITTED → "ส่งงานแล้ว"
    NEEDS_REVISION → "รอแก้ไข"
    """
    mapping = {
        ProcessorStatus.PENDING: "กำลังดำเนินการ",
        ProcessorStatus.IN_PROGRESS: "กำลังดำเนินการ",
        ProcessorStatus.CONFIRMED: "กำลังดำเนินการ",
        ProcessorStatus.SUBMITTED: "ส่งงานแล้ว",
        ProcessorStatus.NEEDS_REVISION: "รอแก้ไข",
    }
    return mapping.get(ps, ps.value)


def get_audit_status_display(audit_status: Optional[str]) -> str:
    """
    แปลง AuditStatus → ข้อความแสดงบนหน้าจอ (ภาษาไทย)
    ถ้า None (ยังไม่มี audit) → "รอตรวจสอบ"
    """
    mapping = {
        AuditStatus.PENDING_REVIEW.value: "รอตรวจสอบ",
        AuditStatus.APPROVED.value: "อนุมัติ",
        AuditStatus.NEEDS_REVISION.value: "ต้องแก้ไข",
    }
    return mapping.get(audit_status, "รอตรวจสอบ") if audit_status else "รอตรวจสอบ"


def generate_draft_code(db: Session) -> str:
    """
    สร้างรหัสฉบับร่าง DFT-XXXX แบบ sequential
    1. หา draft_code ล่าสุดในระบบ → เพิ่ม 1
    2. ถ้าไม่มีเลย → เริ่มจาก DFT-5001 (ตัวเลขเริ่มต้น)
    """
    last = (
        db.query(ProcessorRecord)
        .filter(ProcessorRecord.draft_code.isnot(None))  # เฉพาะที่มี draft_code แล้ว
        .order_by(ProcessorRecord.created_at.desc())     # เอาอันล่าสุด
        .first()
    )
    if last and last.draft_code:
        try:
            num = int(last.draft_code.replace("DFT-", ""))  # แยกตัวเลขออกจาก "DFT-5525"
            return f"DFT-{num + 1}"                          # เพิ่ม 1 → "DFT-5526"
        except (ValueError, AttributeError):
            pass
    # fallback: นับจำนวน draft ที่มีอยู่ทั้งหมด + 5001
    count = (
        db.query(func.count(ProcessorRecord.id))
        .filter(ProcessorRecord.draft_code.isnot(None))
        .scalar() or 0
    )
    return f"DFT-{5001 + count}"


def get_assigned_by_name(record: ProcessorRecord) -> Optional[str]:
    """
    ดึงชื่อ Data Owner ที่มอบหมายงานมา
    เชื่อมผ่าน: ProcessorRecord → RopaDocument → User (owner)
    """
    if record.document and record.document.owner:
        owner = record.document.owner
        return f"{owner.first_name} {owner.last_name}"
    return None


def parse_json_field(value: Optional[str]) -> Optional[list]:
    """
    แปลง JSON string จาก DB กลับเป็น Python list
    DB เก็บ: '["ชื่อ-นามสกุล", "เบอร์โทร"]'
    คืนค่า: ["ชื่อ-นามสกุล", "เบอร์โทร"]
    ถ้า None หรือ parse ไม่ได้ → คืน None
    """
    if not value:
        return None
    try:
        result = json.loads(value)          # แปลง string → Python object
        return result if isinstance(result, list) else None  # ตรวจว่าเป็น list จริงไหม
    except (json.JSONDecodeError, TypeError):
        return None


def to_json(value: Optional[list]) -> Optional[str]:
    """
    แปลง Python list → JSON string สำหรับเก็บลง DB
    รับ: ["ชื่อ-นามสกุล", "เบอร์โทร"]
    คืนค่า: '["ชื่อ-นามสกุล", "เบอร์โทร"]'
    ensure_ascii=False เพื่อให้เก็บภาษาไทยได้
    """
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def apply_form_data(record: ProcessorRecord, data: ProcessorFormData) -> None:
    """
    เขียนข้อมูลจาก ProcessorFormData ลงใน ProcessorRecord
    เขียนเฉพาะ field ที่ไม่ใช่ None (ป้องกันการลบข้อมูลเดิมที่กรอกไว้)
    ใช้ทั้ง save-draft (บางส่วน) และ confirm (ครบทุก field)
    """
    # Section 1
    if data.title_prefix is not None:
        record.title_prefix = data.title_prefix
    if data.first_name is not None:
        record.first_name = data.first_name
    if data.last_name is not None:
        record.last_name = data.last_name
    if data.address is not None:
        record.address = data.address
    if data.email is not None:
        record.email = data.email
    if data.phone is not None:
        record.phone = data.phone
    # Section 2
    if data.processor_name is not None:
        record.processor_name = data.processor_name
    if data.data_controller_address is not None:
        record.data_controller_address = data.data_controller_address
    if data.processing_activity is not None:
        record.processing_activity = data.processing_activity
    if data.purpose is not None:
        record.purpose = data.purpose
    # Section 3
    if data.personal_data is not None:
        record.personal_data = to_json(data.personal_data)     # list → JSON string
    if data.data_category is not None:
        record.data_category = to_json(data.data_category)     # list → JSON string
    if data.data_type is not None:
        record.data_type = data.data_type
    # Section 4
    if data.collection_method is not None:
        record.collection_method = data.collection_method
    if data.data_source is not None:
        record.data_source = data.data_source
    if data.retention_storage_type is not None:
        record.retention_storage_type = to_json(data.retention_storage_type)  # list → JSON string
    if data.retention_method is not None:
        record.retention_method = to_json(data.retention_method)               # list → JSON string
    if data.retention_duration is not None:
        record.retention_duration = data.retention_duration
    if data.retention_duration_unit is not None:
        record.retention_duration_unit = data.retention_duration_unit
    if data.retention_access_condition is not None:
        record.retention_access_condition = data.retention_access_condition
    if data.retention_deletion_method is not None:
        record.retention_deletion_method = data.retention_deletion_method
    # Section 5
    if data.legal_basis is not None:
        record.legal_basis = data.legal_basis
    if data.transfer_is_transfer is not None:
        record.transfer_is_transfer = data.transfer_is_transfer
    if data.transfer_country is not None:
        record.transfer_country = data.transfer_country
    if data.transfer_is_in_group is not None:
        record.transfer_is_in_group = data.transfer_is_in_group
    if data.transfer_company_name is not None:
        record.transfer_company_name = data.transfer_company_name
    if data.transfer_method is not None:
        record.transfer_method = data.transfer_method
    if data.transfer_protection_std is not None:
        record.transfer_protection_std = data.transfer_protection_std
    if data.transfer_exception is not None:
        record.transfer_exception = data.transfer_exception
    # Section 6
    if data.security_organizational is not None:
        record.security_organizational = data.security_organizational
    if data.security_access_control is not None:
        record.security_access_control = data.security_access_control
    if data.security_technical is not None:
        record.security_technical = data.security_technical
    if data.security_responsibility is not None:
        record.security_responsibility = data.security_responsibility
    if data.security_physical is not None:
        record.security_physical = data.security_physical
    if data.security_audit is not None:
        record.security_audit = data.security_audit


def validate_required_fields(data: ProcessorFormData) -> list[str]:
    """
    ตรวจสอบ required fields ทั้งหมดสำหรับการยืนยัน (confirm)
    คืน list ของ field ที่ขาด → ถ้า list ว่าง = กรอกครบแล้ว
    """
    missing = []
    # Section 1 — ต้องครบทุกตัวยกเว้น title_prefix
    if not data.first_name:
        missing.append("first_name")
    if not data.last_name:
        missing.append("last_name")
    if not data.address:
        missing.append("address")
    if not data.email:
        missing.append("email")
    if not data.phone:
        missing.append("phone")
    # Section 2
    if not data.processor_name:
        missing.append("processor_name")
    if not data.data_controller_address:
        missing.append("data_controller_address")
    if not data.processing_activity:
        missing.append("processing_activity")
    if not data.purpose:
        missing.append("purpose")
    # Section 3
    if not data.personal_data:
        missing.append("personal_data")
    if not data.data_category:
        missing.append("data_category")
    if not data.data_type:
        missing.append("data_type")
    # Section 4
    if not data.collection_method:
        missing.append("collection_method")
    if not data.data_source:
        missing.append("data_source")
    if not data.retention_storage_type:
        missing.append("retention_storage_type")
    if not data.retention_method:
        missing.append("retention_method")
    if not data.retention_duration:
        missing.append("retention_duration")
    if not data.retention_duration_unit:
        missing.append("retention_duration_unit")
    if not data.retention_access_condition:
        missing.append("retention_access_condition")
    if not data.retention_deletion_method:
        missing.append("retention_deletion_method")
    # Section 5
    if not data.legal_basis:
        missing.append("legal_basis")
    if data.transfer_is_transfer:
        # ถ้าเลือก "มี" การส่งต่างประเทศ → fields เหล่านี้กลายเป็น required
        if not data.transfer_country:
            missing.append("transfer_country")
        if not data.transfer_method:
            missing.append("transfer_method")
        if not data.transfer_protection_std:
            missing.append("transfer_protection_std")
        if not data.transfer_exception:
            missing.append("transfer_exception")
    return missing


def build_form_response(record: ProcessorRecord, db: Session = None) -> dict:
    """
    สร้าง response dict ของข้อมูลฟอร์ม 6 ส่วน
    ใช้กับ GET /assignments/{id} — เส้นทางเดียวสำหรับทุก sidebar
    แปลง JSON string กลับเป็น list สำหรับ field ที่เก็บแบบ JSON
    ถ้าส่ง db มาด้วย → ดึง audit_status มาแสดงด้วย

    กฎ is_read_only:
      - มี audit และ status = NEEDS_REVISION → แก้ไขได้ (is_read_only=False)
      - มี audit และ status อื่น (PENDING_REVIEW / APPROVED) → อ่านอย่างเดียว
      - ไม่มี audit + status เป็น SUBMITTED → อ่านอย่างเดียว (รอ Data Owner ส่งให้ Auditor)
      - ไม่มี audit + status อื่น (PENDING/IN_PROGRESS/CONFIRMED) → แก้ไขได้
    """
    doc = record.document
    audit_status_val = None
    is_read_only = True

    if db:
        # ดึง audit ล่าสุดของเอกสารนี้ (เรียงจากใหม่สุด)
        audit = (
            db.query(AuditorAudit)
            .filter(AuditorAudit.ropa_doc_id == record.ropa_doc_id)
            .order_by(AuditorAudit.request_change_at.desc())
            .first()
        )
        if audit and audit.audit_status:
            audit_status_val = audit.audit_status.value
            # แก้ไขได้เฉพาะเมื่อ Auditor สั่งให้แก้ไข (NEEDS_REVISION)
            # PENDING_REVIEW และ APPROVED → read-only
            is_read_only = audit.audit_status != AuditStatus.NEEDS_REVISION
        else:
            # ยังไม่มี audit → แก้ไขได้ถ้ายังไม่ได้ submit
            # SUBMITTED → read-only (รอ Data Owner ส่งให้ Auditor ก่อน)
            is_read_only = record.processor_status == ProcessorStatus.SUBMITTED

    ps = record.processor_status or ProcessorStatus.PENDING
    return {
        # ── metadata ──
        "id": record.id,
        "doc_code": get_doc_code(doc) if doc else None,  # รหัสเอกสาร
        "title": doc.title if doc else "",               # ชื่อรายการ
        "processor_status": ps.value,                    # status ปัจจุบัน
        "draft_code": record.draft_code,                 # รหัสฉบับร่าง
        "assigned_by": get_assigned_by_name(record),     # ชื่อ Data Owner
        "received_at": record.created_at,                # วันที่ได้รับมอบหมาย
        "confirmed_at": record.confirmed_at,             # วันที่ยืนยัน
        "sent_to_owner_at": record.sent_to_owner_at,     # วันที่ส่ง Data Owner
        "updated_at": record.updated_at,                 # วันที่บันทึกล่าสุด
        "audit_status": audit_status_val,                # สถานะ audit
        "audit_status_display": get_audit_status_display(audit_status_val),
        "is_read_only": is_read_only,   # frontend ใช้ตัดสินใจว่า disable input ไหม
        # ── Section 1 ──
        "title_prefix": record.title_prefix,
        "first_name": record.first_name,
        "last_name": record.last_name,
        "address": record.address,
        "email": record.email,
        "phone": record.phone,
        # ── Section 2 ──
        "processor_name": record.processor_name,
        "data_controller_address": record.data_controller_address,
        "processing_activity": record.processing_activity,
        "purpose": record.purpose,
        # ── Section 3 ──
        "personal_data": parse_json_field(record.personal_data),    # Text → list
        "data_category": parse_json_field(record.data_category),    # Text → list
        "data_type": record.data_type,
        # ── Section 4 ──
        "collection_method": record.collection_method,
        "data_source": record.data_source,
        "retention_storage_type": parse_json_field(record.retention_storage_type),  # Text → list
        "retention_method": parse_json_field(record.retention_method),               # Text → list
        "retention_duration": record.retention_duration,
        "retention_duration_unit": record.retention_duration_unit,
        "retention_access_condition": record.retention_access_condition,
        "retention_deletion_method": record.retention_deletion_method,
        # ── Section 5 ──
        "legal_basis": record.legal_basis,
        "transfer_is_transfer": record.transfer_is_transfer,
        "transfer_country": record.transfer_country,
        "transfer_is_in_group": record.transfer_is_in_group,
        "transfer_company_name": record.transfer_company_name,
        "transfer_method": record.transfer_method,
        "transfer_protection_std": record.transfer_protection_std,
        "transfer_exception": record.transfer_exception,
        # ── Section 6 ──
        "security_organizational": record.security_organizational,
        "security_access_control": record.security_access_control,
        "security_technical": record.security_technical,
        "security_responsibility": record.security_responsibility,
        "security_physical": record.security_physical,
        "security_audit": record.security_audit,
    }


def reset_form_fields(record: ProcessorRecord) -> None:
    """
    ล้างข้อมูลทุก field ในฟอร์มทั้ง 6 ส่วน
    ใช้ตอนกด "ลบ" ฉบับร่าง → ไม่ลบ record จริง แค่เคลียร์ข้อมูล
    """
    record.title_prefix = None
    record.first_name = None
    record.last_name = None
    record.address = None
    record.email = None
    record.phone = None
    record.processor_name = None
    record.data_controller_address = None
    record.processing_activity = None
    record.purpose = None
    record.personal_data = None
    record.data_category = None
    record.data_type = None
    record.collection_method = None
    record.data_source = None
    record.retention_storage_type = None
    record.retention_method = None
    record.retention_duration = None
    record.retention_duration_unit = None
    record.retention_access_condition = None
    record.retention_deletion_method = None
    record.legal_basis = None
    record.transfer_is_transfer = None
    record.transfer_country = None
    record.transfer_is_in_group = None
    record.transfer_company_name = None
    record.transfer_method = None
    record.transfer_protection_std = None
    record.transfer_exception = None
    record.security_organizational = None
    record.security_access_control = None
    record.security_technical = None
    record.security_responsibility = None
    record.security_physical = None
    record.security_audit = None


def get_latest_audit(ropa_doc_id, db: Session):
    """
    ดึง AuditorAudit ล่าสุดของเอกสารนั้น
    เรียงจาก request_change_at มากสุด (ใหม่สุด)
    """
    return (
        db.query(AuditorAudit)
        .filter(AuditorAudit.ropa_doc_id == ropa_doc_id)
        .order_by(AuditorAudit.request_change_at.desc())
        .first()
    )


# ════════════════════════════════════════════════════════
# SIDEBAR 1: รายการ RoPA
# ════════════════════════════════════════════════════════

@router.get("/assignments", response_model=AssignmentListResponse)
def get_assignments(
    status_filter: Optional[str] = Query(None, alias="status"),
    # รับ ?status=... จาก URL เช่น ?status=ส่งงานแล้ว
    # alias="status" เพราะชื่อ "status" ชนกับ built-in ของ Python

    date_from: Optional[datetime] = Query(None),  # กรองจากวันที่เริ่ม
    date_to: Optional[datetime] = Query(None),    # กรองถึงวันที่นี้
    page: int = Query(1, ge=1),                   # หน้าที่ต้องการ (ต้อง >= 1)
    page_size: int = Query(10, ge=1, le=100),     # จำนวนต่อหน้า (1-100)
    db: Session = Depends(get_db),                # inject DB session อัตโนมัติ
    current_user: User = Depends(require_processor),  # ตรวจ role Data Processor
):
    """
    Sidebar 1 — รายการ RoPA ที่ได้รับมอบหมาย
    คืน: stats 4 ใบ + ตารางรายการ + pagination
    """

    # query พื้นฐาน: ProcessorRecord ทั้งหมดที่ assigned ให้ current_user
    base_q = (
        db.query(ProcessorRecord)
        .join(RopaDocument, ProcessorRecord.ropa_doc_id == RopaDocument.id)
        # JOIN กับ RopaDocument เพื่อดึงชื่อเอกสารและ owner
        .filter(ProcessorRecord.assigned_to == current_user.id)
        # กรองเฉพาะที่ assign ให้คนนี้เท่านั้น
    )

    # ── คำนวณ Stats (ไม่ใส่ filter เพราะต้องนับ ALL) ──
    all_records = base_q.all()  # ดึงทั้งหมดมาก่อน
    in_progress_count = sum(
        1 for r in all_records
        if r.processor_status in (
            ProcessorStatus.PENDING,
            ProcessorStatus.IN_PROGRESS,
            ProcessorStatus.CONFIRMED,
        )
        # นับทุก status ที่ยังไม่ส่ง = "รอดำเนินการ"
    )
    needs_revision_count = sum(
        1 for r in all_records if r.processor_status == ProcessorStatus.NEEDS_REVISION
        # นับเฉพาะที่ Auditor ส่งกลับมาแก้
    )
    submitted_count = sum(
        1 for r in all_records if r.processor_status == ProcessorStatus.SUBMITTED
        # นับเฉพาะที่ส่งให้ Data Owner แล้ว
    )

    # ── Apply filter สำหรับตาราง ──
    filtered_q = base_q
    if status_filter:
        sf = status_filter.lower()
        if sf in ("in_progress", "กำลังดำเนินการ", "รอดำเนินการ"):
            # กรองเฉพาะ 3 status ที่แสดงเป็น "กำลังดำเนินการ"
            filtered_q = filtered_q.filter(
                ProcessorRecord.processor_status.in_([
                    ProcessorStatus.PENDING,
                    ProcessorStatus.IN_PROGRESS,
                    ProcessorStatus.CONFIRMED,
                ])
            )
        elif sf in ("needs_revision", "รอแก้ไข", "แก้ไขตาม feedback"):
            filtered_q = filtered_q.filter(
                ProcessorRecord.processor_status == ProcessorStatus.NEEDS_REVISION
            )
        elif sf in ("submitted", "ส่งงานแล้ว"):
            filtered_q = filtered_q.filter(
                ProcessorRecord.processor_status == ProcessorStatus.SUBMITTED
            )

    if date_from:
        filtered_q = filtered_q.filter(ProcessorRecord.created_at >= date_from)
    if date_to:
        filtered_q = filtered_q.filter(ProcessorRecord.created_at <= date_to)

    # นับจำนวนทั้งหมด (หลัง filter) สำหรับ pagination
    total = filtered_q.count()

    # ดึงเฉพาะหน้าปัจจุบัน
    records = (
        filtered_q
        .order_by(ProcessorRecord.created_at.desc())        # เรียงจากใหม่สุด
        .offset((page - 1) * page_size)                     # ข้ามแถวของหน้าก่อนหน้า
        .limit(page_size)                                    # เอาแค่ page_size แถว
        .all()
    )

    # แปลงแต่ละ record เป็น AssignmentListItem
    items = [
        AssignmentListItem(
            id=r.id,
            doc_code=get_doc_code(r.document) if r.document else None,
            title=r.document.title if r.document else "",
            assigned_by=get_assigned_by_name(r),            # ชื่อ Data Owner
            received_at=r.created_at,
            processor_status=r.processor_status.value,
            status_display=get_status_display(r.processor_status),  # แปลงเป็นภาษาไทย
            can_edit=r.processor_status in (
                ProcessorStatus.PENDING,
                ProcessorStatus.IN_PROGRESS,
                ProcessorStatus.CONFIRMED,
                ProcessorStatus.NEEDS_REVISION,
            ),
            # can_edit = false เฉพาะ SUBMITTED (ส่งแล้วแก้ไม่ได้)
        )
        for r in records
    ]

    return AssignmentListResponse(
        stats=AssignmentStats(
            total=len(all_records),
            in_progress=in_progress_count,
            needs_revision=needs_revision_count,
            submitted=submitted_count,
        ),
        records=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/assignments/{record_id}")
def get_assignment_form(
    record_id: UUID,                                    # id จาก URL path
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    เปิดฟอร์ม 6 ส่วน — ใช้ร่วมกันทุก sidebar
    - Sidebar 1 กดปุ่ม "แก้ไข"
    - Sidebar 2 กดปุ่ม "ดูเอกสาร"
    - Sidebar 3 กดปุ่ม "แก้ไขเอกสาร" (frontend redirect มาจาก processor_record_id)
    ทุก action นำมาที่หน้าฟอร์มนี้ เส้นทางเดียวกัน
    `is_read_only` ใน response บอก frontend ว่าให้ disable input ไหม
    """
    record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.id == record_id,
            ProcessorRecord.assigned_to == current_user.id,  # ป้องกันดูของคนอื่น
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # ไม่ block SUBMITTED อีกต่อไป
    # แค่คืน is_read_only=True → frontend disable input อัตโนมัติ
    return build_form_response(record, db)  # is_read_only คำนวณใน build_form_response


@router.put("/assignments/{record_id}/save-draft")
def save_draft(
    record_id: UUID,
    data: ProcessorFormData,        # ข้อมูลที่ frontend ส่งมา (อาจไม่ครบก็ได้)
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    บันทึกฉบับร่าง — กดได้ทุกเวลา ไม่ต้องกรอกครบ
    - สร้าง draft_code ครั้งแรกที่กด
    - PENDING / NEEDS_REVISION → IN_PROGRESS
    - เขียนเฉพาะ field ที่ส่งมา (ไม่ลบข้อมูลเดิม)
    """
    record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.id == record_id,
            ProcessorRecord.assigned_to == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.processor_status == ProcessorStatus.SUBMITTED:
        raise HTTPException(status_code=403, detail="Cannot edit a submitted record")

    # สร้าง draft_code ถ้าเป็นการ save ครั้งแรก
    if not record.draft_code:
        record.draft_code = generate_draft_code(db)

    # เปลี่ยน status ให้สะท้อนว่ากำลังดำเนินการอยู่
    if record.processor_status in (ProcessorStatus.PENDING, ProcessorStatus.NEEDS_REVISION):
        record.processor_status = ProcessorStatus.IN_PROGRESS

    apply_form_data(record, data)                          # เขียนข้อมูลลง record
    record.updated_at = datetime.now(timezone.utc)         # อัพเดทเวลาบันทึกล่าสุด

    db.commit()       # บันทึกลง DB จริงๆ
    db.refresh(record)  # โหลดข้อมูลล่าสุดกลับมา (รวม draft_code ที่เพิ่งสร้าง)

    return {
        "message": "บันทึกฉบับร่างเรียบร้อย",
        "draft_code": record.draft_code,   # คืน draft_code ให้ frontend แสดง
        "record_id": str(record.id),
    }


@router.put("/assignments/{record_id}/confirm")
def confirm_record(
    record_id: UUID,
    data: ProcessorFormData,        # ต้องครบทุก required field
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    ยืนยันข้อมูล RoPA — กรอกครบแล้ว พร้อมส่ง
    - validate required fields ทั้งหมด → ถ้าขาด return 422 + รายชื่อ field ที่ขาด
    - status → CONFIRMED
    - หายจากตาราง "ฉบับร่าง" (sidebar 2)
    - ปรากฏใน modal "เลือกรายการ" (ready-to-send)
    """
    record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.id == record_id,
            ProcessorRecord.assigned_to == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.processor_status == ProcessorStatus.SUBMITTED:
        raise HTTPException(status_code=403, detail="Cannot edit a submitted record")

    # ตรวจสอบว่ากรอกครบไหม
    missing = validate_required_fields(data)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "กรุณากรอกข้อมูลให้ครบถ้วน",
                "missing_fields": missing,  # บอก frontend ว่า field ไหนขาด
            },
        )

    # สร้าง draft_code ถ้ายังไม่มี (กรณีกด confirm โดยไม่เคย save draft มาก่อน)
    if not record.draft_code:
        record.draft_code = generate_draft_code(db)

    apply_form_data(record, data)
    record.processor_status = ProcessorStatus.CONFIRMED        # พร้อมส่งแล้ว
    record.confirmed_at = datetime.now(timezone.utc)           # บันทึกเวลายืนยัน
    record.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "ยืนยันข้อมูล RoPA เรียบร้อย", "record_id": str(record_id)}


@router.get("/ready-to-send", response_model=ReadyToSendResponse)
def get_ready_to_send(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    Modal "รายการที่ต้องการส่งเฉพาะฉบับที่เสร็จสมบูรณ์"
    เปิดเมื่อกดปุ่ม "เลือกรายการ" (สีแดง) ใน sidebar 1
    แสดงเฉพาะ records ที่ CONFIRMED (ยืนยันแล้ว รอส่ง)
    """
    q = (
        db.query(ProcessorRecord)
        .join(RopaDocument, ProcessorRecord.ropa_doc_id == RopaDocument.id)
        .filter(
            ProcessorRecord.assigned_to == current_user.id,
            ProcessorRecord.processor_status == ProcessorStatus.CONFIRMED,
            # เฉพาะที่ยืนยันแล้วแต่ยังไม่ส่ง
        )
    )

    total = q.count()
    records = (
        q.order_by(ProcessorRecord.confirmed_at.desc())  # เรียงจากยืนยันล่าสุด
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        ReadyToSendItem(
            id=r.id,
            doc_code=get_doc_code(r.document) if r.document else None,
            title=r.document.title if r.document else "",
            created_at=r.document.created_at if r.document else r.created_at,
            # ใช้วันสร้างของ RopaDocument (วันที่ Data Owner สร้าง)
        )
        for r in records
    ]

    return ReadyToSendResponse(records=items, total=total, page=page, page_size=page_size)


@router.post("/send-to-owner/{record_id}")
def send_to_owner(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    ส่ง RoPA ให้ผู้รับผิดชอบข้อมูล (Data Owner)
    กดปุ่ม "ส่ง RoPA ให้ผู้รับผิดชอบข้อมูล" (สีแดง) ใน sidebar 1
    - ต้องเป็น CONFIRMED เท่านั้น (ถ้าไม่ใช่ → 400)
    - status → SUBMITTED, บันทึก sent_to_owner_at
    - record หายจาก modal, ปรากฏในตาราง status "ส่งงานแล้ว"
    """
    record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.id == record_id,
            ProcessorRecord.assigned_to == current_user.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.processor_status != ProcessorStatus.CONFIRMED:
        # ป้องกันส่งซ้ำหรือส่งโดยไม่ได้ยืนยันก่อน
        raise HTTPException(
            status_code=400,
            detail="Only confirmed records can be sent. Please confirm the form first.",
        )

    record.processor_status = ProcessorStatus.SUBMITTED           # ส่งแล้ว
    record.sent_to_owner_at = datetime.now(timezone.utc)          # เวลาที่ส่ง
    record.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "ส่ง RoPA ให้ผู้รับผิดชอบข้อมูลเรียบร้อย",
        "record_id": str(record_id),
    }


# ════════════════════════════════════════════════════════
# SIDEBAR 2: เอกสาร
# ════════════════════════════════════════════════════════

@router.get("/documents", response_model=DocumentsPageResponse)
def get_documents_page(
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[datetime] = Query(None),
    time_range: Optional[str] = Query(None),
    # ช่วงเวลา: "7_days" / "30_days" / "90_days" / "all"
    active_page: int = Query(1, ge=1),      # หน้าของตาราง "รายการที่ดำเนินการ"
    drafts_page: int = Query(1, ge=1),      # หน้าของตาราง "ฉบับร่าง"
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    Sidebar 2 — เอกสารของผู้ประมวลผลข้อมูลส่วนบุคคล
    คืน: stats 2 ใบ + ตาราง "รายการที่ดำเนินการ" + ตาราง "ฉบับร่าง"
    """

    # ── ตาราง "รายการที่ดำเนินการ" ──
    # แสดงเฉพาะ records ที่ส่งแล้วและ RopaDocument อยู่ในกระบวนการตรวจของ Auditor
    active_q = (
        db.query(ProcessorRecord)
        .join(RopaDocument, ProcessorRecord.ropa_doc_id == RopaDocument.id)
        .filter(
            ProcessorRecord.assigned_to == current_user.id,
            ProcessorRecord.processor_status.in_([
                ProcessorStatus.SUBMITTED,       # ส่งให้ Data Owner แล้ว
                ProcessorStatus.NEEDS_REVISION,  # Auditor ส่งกลับมาแก้ (ยังอยู่ในกระบวนการ)
            ]),
            RopaDocument.status.in_([
                DocumentStatus.PENDING_AUDITOR,   # Data Owner ส่งให้ Auditor แล้ว
                DocumentStatus.APPROVED,          # Auditor อนุมัติแล้ว
                DocumentStatus.REJECTED_PROCESSOR,# Auditor ส่งกลับให้ Processor
                DocumentStatus.REJECTED_OWNER,    # Auditor ส่งกลับให้ Owner
            ]),
        )
    )

    # กรองตาม time_range
    if time_range and time_range != "all":
        days_map = {"7_days": 7, "30_days": 30, "90_days": 90}
        days = days_map.get(time_range, 30)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)  # คำนวณวันตัด
        active_q = active_q.filter(ProcessorRecord.sent_to_owner_at >= cutoff)
    elif date_from:
        active_q = active_q.filter(ProcessorRecord.sent_to_owner_at >= date_from)

    active_total = active_q.count()
    active_raw = (
        active_q
        .order_by(ProcessorRecord.sent_to_owner_at.desc())
        .offset((active_page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # สร้าง active items พร้อม audit_status ของแต่ละเอกสาร
    active_items = []
    for r in active_raw:
        audit = get_latest_audit(r.ropa_doc_id, db)  # ดึง audit ล่าสุด
        audit_status_val = audit.audit_status.value if (audit and audit.audit_status) else None

        # กรองตาม status_filter (ถ้ามี)
        if status_filter:
            sf = status_filter.lower()
            display = get_audit_status_display(audit_status_val).lower()
            if sf not in (audit_status_val or "", display):
                continue  # ข้ามแถวที่ไม่ตรง filter

        active_items.append(
            ActiveDocumentItem(
                id=r.id,
                doc_code=get_doc_code(r.document) if r.document else None,
                title=r.document.title if r.document else "",
                sent_at=r.sent_to_owner_at,
                audit_status=audit_status_val,
                audit_status_display=get_audit_status_display(audit_status_val),
                can_edit=(audit and audit.audit_status == AuditStatus.NEEDS_REVISION),
                # แก้ไขได้เฉพาะเมื่อ Auditor สั่งให้แก้ไข
            )
        )

    # นับจำนวน "เอกสารฉบับสมบูรณ์" (approved) จากทุก record ไม่ใช่แค่หน้านี้
    all_active = active_q.all()
    complete_count = 0
    for r in all_active:
        audit = get_latest_audit(r.ropa_doc_id, db)
        if audit and audit.audit_status == AuditStatus.APPROVED:
            complete_count += 1

    # ── ตาราง "ฉบับร่าง" ──
    # แสดงเฉพาะ IN_PROGRESS ที่มี draft_code (เคยกด save draft แล้ว)
    drafts_q = (
        db.query(ProcessorRecord)
        .join(RopaDocument, ProcessorRecord.ropa_doc_id == RopaDocument.id)
        .filter(
            ProcessorRecord.assigned_to == current_user.id,
            ProcessorRecord.processor_status == ProcessorStatus.IN_PROGRESS,
            ProcessorRecord.draft_code.isnot(None),  # ต้องมี draft_code
        )
    )

    drafts_total = drafts_q.count()
    drafts_raw = (
        drafts_q
        .order_by(ProcessorRecord.updated_at.desc())  # เรียงจากแก้ไขล่าสุด
        .offset((drafts_page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    draft_items = [
        DraftItem(
            id=r.id,
            draft_code=r.draft_code,
            title=r.document.title if r.document else "",
            updated_at=r.updated_at,  # วันที่บันทึกล่าสุด
        )
        for r in drafts_raw
    ]

    return DocumentsPageResponse(
        stats=DocumentStats(total=active_total, complete=complete_count),
        active_records=active_items,
        active_total=active_total,
        active_page=active_page,
        drafts=draft_items,
        drafts_total=drafts_total,
        drafts_page=drafts_page,
        page_size=page_size,
    )



@router.delete("/drafts/{record_id}", status_code=204)
def delete_draft(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    ลบเอกสารฉบับร่าง — กดปุ่ม "🗑 ลบ" ในตาราง "ฉบับร่าง" sidebar 2
    ไม่ลบ ProcessorRecord จริง (เพราะ Data Owner ยังคง assign อยู่)
    แค่ reset ข้อมูลทั้งหมด + draft_code = null + status → PENDING
    ผล: หายจากตาราง "ฉบับร่าง", กลับไปอยู่ใน sidebar 1 สถานะ "กำลังดำเนินการ"
    """
    record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.id == record_id,
            ProcessorRecord.assigned_to == current_user.id,
            ProcessorRecord.processor_status == ProcessorStatus.IN_PROGRESS,
            # ลบได้เฉพาะ IN_PROGRESS (มี draft_code)
            ProcessorRecord.draft_code.isnot(None),
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Draft not found")

    reset_form_fields(record)               # ล้างข้อมูลฟอร์มทั้งหมด
    record.draft_code = None                # ลบรหัสฉบับร่าง
    record.processor_status = ProcessorStatus.PENDING  # กลับสู่สถานะเริ่มต้น
    record.confirmed_at = None              # ล้างเวลายืนยัน
    record.updated_at = datetime.now(timezone.utc)

    db.commit()
    # status_code=204 = No Content (ไม่ต้อง return อะไร)


# ════════════════════════════════════════════════════════
# SIDEBAR 3: ข้อเสนอแนะ
# ════════════════════════════════════════════════════════

@router.get("/feedback", response_model=FeedbackListResponse)
def get_feedback_list(
    date_from: Optional[datetime] = Query(None),
    time_range: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    Sidebar 3 — รายการแจ้งเตือนข้อเสนอแนะจากผู้ตรวจสอบ
    แสดงเฉพาะ AuditorAudit ที่:
      1. เป็นเอกสารที่ current_user ถูก assign
      2. audit_status = NEEDS_REVISION (ต้องแก้ไข)
      3. มี processor_feedback (Auditor เขียน comment ให้ Processor)
    """

    # หา ropa_doc_id ทั้งหมดที่ current_user ถูก assign
    my_doc_ids = (
        db.query(ProcessorRecord.ropa_doc_id)
        .filter(ProcessorRecord.assigned_to == current_user.id)
        .subquery()
        # subquery = ใช้ผลลัพธ์นี้เป็น sub-select ใน query ถัดไป
    )

    q = (
        db.query(AuditorAudit)
        .join(RopaDocument, AuditorAudit.ropa_doc_id == RopaDocument.id)
        .filter(
            AuditorAudit.ropa_doc_id.in_(my_doc_ids),          # เฉพาะเอกสารที่ถูก assign
            AuditorAudit.audit_status == AuditStatus.NEEDS_REVISION,  # ต้องแก้ไขเท่านั้น
            AuditorAudit.processor_feedback.isnot(None),        # มี feedback จริงๆ
        )
    )

    # กรองตาม time_range
    if time_range and time_range != "all":
        days_map = {"7_days": 7, "30_days": 30, "90_days": 90}
        days = days_map.get(time_range, 30)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.filter(AuditorAudit.request_change_at >= cutoff)
    elif date_from:
        q = q.filter(AuditorAudit.request_change_at >= date_from)

    total = q.count()
    audits = (
        q.order_by(AuditorAudit.request_change_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        FeedbackListItem(
            audit_id=a.id,
            doc_code=get_doc_code(a.document) if a.document else None,
            title=a.document.title if a.document else "",
            sent_at=a.request_change_at,      # วันที่ Auditor ส่ง feedback
            received_at=a.request_change_at,  # ปัจจุบันใช้ค่าเดียวกัน
        )
        for a in audits
    ]

    return FeedbackListResponse(feedbacks=items, total=total, page=page, page_size=page_size)


@router.get("/feedback/{audit_id}", response_model=FeedbackDetailResponse)
def get_feedback_detail(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_processor),
):
    """
    ดูข้อเสนอแนะ — เปิดเมื่อกดปุ่ม "ดูข้อเสนอแนะ" ใน sidebar 3
    แสดง: รหัสเอกสาร, วันที่แก้ไขล่าสุด, ชื่อ Auditor, comment แยกตามส่วน
    คืน processor_record_id สำหรับปุ่ม "แก้ไขเอกสาร"
    """

    # ตรวจว่า audit นี้เป็นของเอกสารที่ current_user ถูก assign จริงไหม
    my_doc_ids = (
        db.query(ProcessorRecord.ropa_doc_id)
        .filter(ProcessorRecord.assigned_to == current_user.id)
        .subquery()
    )

    audit = (
        db.query(AuditorAudit)
        .filter(
            AuditorAudit.id == audit_id,
            AuditorAudit.ropa_doc_id.in_(my_doc_ids),  # ป้องกันดู feedback ของคนอื่น
        )
        .first()
    )
    if not audit:
        raise HTTPException(status_code=404, detail="Feedback not found")

    doc = audit.document

    # ดึงชื่อ Auditor: AuditorAudit → AuditorProfile → User
    auditor_name = None
    if audit.auditor and audit.auditor.user:
        u = audit.auditor.user
        auditor_name = f"{u.first_name} {u.last_name}"

    # แปลง processor_feedback JSON → list ของ SectionFeedback
    # processor_feedback เก็บเป็น: '{"section_5": "comment...", "section_6": "comment..."}'
    section_feedbacks = []
    if audit.processor_feedback:
        try:
            feedback_data = json.loads(audit.processor_feedback)  # แปลง string → dict
            for key, comment in feedback_data.items():
                if comment:  # ข้ามส่วนที่ไม่มี comment
                    section_feedbacks.append(
                        SectionFeedback(
                            section=key,        # "section_5"
                            section_label=SECTION_LABELS.get(key, key),
                            # แปลง key → ชื่อแสดง เช่น "ส่วนที่ 5 : ฐานทางกฎหมาย..."
                            comment=str(comment),
                        )
                    )
        except (json.JSONDecodeError, TypeError):
            pass  # ถ้า parse ไม่ได้ → คืน empty list

    # ดึง ProcessorRecord id สำหรับปุ่ม "แก้ไขเอกสาร"
    processor_record = (
        db.query(ProcessorRecord)
        .filter(
            ProcessorRecord.ropa_doc_id == audit.ropa_doc_id,
            ProcessorRecord.assigned_to == current_user.id,
        )
        .first()
    )

    return FeedbackDetailResponse(
        audit_id=audit.id,
        doc_code=get_doc_code(doc) if doc else None,
        title=doc.title if doc else "",
        last_modified=audit.updated_at or audit.request_change_at,
        # ใช้ updated_at ก่อน ถ้าไม่มีค่อยใช้ request_change_at
        auditor_name=auditor_name,
        section_feedbacks=section_feedbacks,
        processor_record_id=processor_record.id if processor_record else None,
        # frontend ใช้ค่านี้ redirect ไป GET /assignments/{processor_record_id}
        # เมื่อกดปุ่ม "แก้ไขเอกสาร"
    )
