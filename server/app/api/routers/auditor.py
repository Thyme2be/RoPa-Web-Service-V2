import json
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, RoleChecker
from app.models.document import (
    AuditStatus,
    AuditorAudit,
    AuditorProfile,
    DeletedDocumentLog,
    DocumentStatus,
    OwnerRecord,
    ProcessorRecord,
    ProcessorStatus,
    RopaDocument,
)
from app.models.user import User
from app.schemas.auditor import (
    DashboardResponse,
    DocumentListItem,
    DocumentListResponse,
    DocumentStats,
    ExpiredDocItem,
    ExpiredDocListResponse,
    ExpiredDocStats,
    FormResponse,
    MonthlyTrend,
    SectionFeedback,
    SubmitFeedbackRequest,
    SubmitFeedbackResponse,
)

router = APIRouter()

require_auditor = RoleChecker(["Auditor"])

# ── Section label mapping ──
SECTION_LABELS = {
    "section_1": "ส่วนที่ 1 : รายละเอียดของผู้บันทึก RoPA",
    "section_2": "ส่วนที่ 2 : รายละเอียดกิจกรรม",
    "section_3": "ส่วนที่ 3 : ข้อมูลที่จัดเก็บ",
    "section_4": "ส่วนที่ 4 : การได้มาและการเก็บรักษา",
    "section_5": "ส่วนที่ 5 : ฐานทางกฎหมายและการส่งต่อ",
    "section_6": "ส่วนที่ 6 : มาตรการรักษาความมั่นคงปลอดภัย (TOMs)",
}


# ════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ════════════════════════════════════════════════════════

def get_auditor_profile(user_id, db: Session) -> AuditorProfile:
    """หา AuditorProfile จาก user_id — ถ้าไม่มี raise 403"""
    profile = db.query(AuditorProfile).filter(AuditorProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=403, detail="ไม่พบข้อมูล Auditor Profile กรุณาติดต่อ Admin")
    return profile


def get_doc_code(doc: RopaDocument) -> Optional[str]:
    """คืนรหัสเอกสาร หรือสร้าง fallback จาก UUID"""
    if doc.doc_code:
        return doc.doc_code
    year = doc.created_at.year if doc.created_at else datetime.now(timezone.utc).year
    return f"RP-{year}-{str(doc.id)[:4].upper()}"


def parse_json_field(value: Optional[str]) -> Optional[list]:
    """แปลง JSON string → Python list (ใช้กับ field ที่เก็บเป็น JSON array)"""
    if not value:
        return None
    try:
        result = json.loads(value)
        return result if isinstance(result, list) else None
    except (json.JSONDecodeError, TypeError):
        return None


def parse_feedback_json(raw: Optional[str]) -> list:
    """
    แปลง JSON string จาก DB → list ของ SectionFeedback dict
    รองรับทั้ง format ใหม่ (list) และเก่า (dict {section: comment})
    """
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            # backward compat: {"section_2": "comment"} → list format
            return [
                {
                    "section": k,
                    "section_label": SECTION_LABELS.get(k, k),
                    "comment": v,
                }
                for k, v in data.items()
            ]
    except (json.JSONDecodeError, TypeError):
        pass
    return []


def get_time_cutoff(time_range: str) -> Optional[datetime]:
    """แปลง time_range string → datetime cutoff"""
    now = datetime.now(timezone.utc)
    if time_range == "7_days":
        return now - timedelta(days=7)
    elif time_range == "30_days":
        return now - timedelta(days=30)
    elif time_range == "90_days":
        return now - timedelta(days=90)
    return None  # "all" → ไม่ filter


def build_owner_form_data(record: OwnerRecord) -> dict:
    """แปลง OwnerRecord → dict ของ field ทั้ง 6 ส่วน"""
    return {
        # Section 1
        "record_name": record.record_name,
        "address": record.address,
        "email": record.email,
        "phone": record.phone,
        # Section 2
        "data_subject_name": record.data_subject_name,
        "processing_activity": record.processing_activity,
        "purpose": record.purpose,
        # Section 3
        "personal_data": record.personal_data,
        "data_category": record.data_category,
        "data_type": record.data_type,
        # Section 4
        "collection_method": record.collection_method,
        "source_direct": record.source_direct,
        "source_indirect": record.source_indirect,
        "retention_storage_type": record.retention_storage_type,
        "retention_method": record.retention_method,
        "retention_duration": record.retention_duration,
        "retention_access_control": record.retention_access_control,
        "retention_deletion_method": record.retention_deletion_method,
        # Section 5
        "legal_basis": record.legal_basis,
        "minor_under10": record.minor_under10,
        "minor_10to20": record.minor_10to20,
        "transfer_is_transfer": record.transfer_is_transfer,
        "transfer_country": record.transfer_country,
        "transfer_company_name": record.transfer_company_name,
        "transfer_method": record.transfer_method,
        "transfer_protection_std": record.transfer_protection_std,
        "transfer_exception": record.transfer_exception,
        "exemption_disclosure": record.exemption_disclosure,
        "rejection_note": record.rejection_note,
        # Section 6
        "security_organizational": record.security_organizational,
        "security_technical": record.security_technical,
        "security_physical": record.security_physical,
        "security_access_control": record.security_access_control,
        "security_responsibility": record.security_responsibility,
        "security_audit": record.security_audit,
    }


def build_processor_form_data(record: ProcessorRecord) -> dict:
    """แปลง ProcessorRecord → dict ของ field ทั้ง 6 ส่วน"""
    return {
        # Section 1
        "title_prefix": record.title_prefix,
        "first_name": record.first_name,
        "last_name": record.last_name,
        "address": record.address,
        "email": record.email,
        "phone": record.phone,
        # Section 2
        "processor_name": record.processor_name,
        "data_controller_address": record.data_controller_address,
        "processing_activity": record.processing_activity,
        "purpose": record.purpose,
        # Section 3
        "personal_data": parse_json_field(record.personal_data),
        "data_category": parse_json_field(record.data_category),
        "data_type": record.data_type,
        # Section 4
        "collection_method": record.collection_method,
        "data_source": record.data_source,
        "retention_storage_type": parse_json_field(record.retention_storage_type),
        "retention_method": parse_json_field(record.retention_method),
        "retention_duration": record.retention_duration,
        "retention_duration_unit": record.retention_duration_unit,
        "retention_access_condition": record.retention_access_condition,
        "retention_deletion_method": record.retention_deletion_method,
        # Section 5
        "legal_basis": record.legal_basis,
        "transfer_is_transfer": record.transfer_is_transfer,
        "transfer_country": record.transfer_country,
        "transfer_is_in_group": record.transfer_is_in_group,
        "transfer_company_name": record.transfer_company_name,
        "transfer_method": record.transfer_method,
        "transfer_protection_std": record.transfer_protection_std,
        "transfer_exception": record.transfer_exception,
        # Section 6
        "security_organizational": record.security_organizational,
        "security_access_control": record.security_access_control,
        "security_technical": record.security_technical,
        "security_responsibility": record.security_responsibility,
        "security_physical": record.security_physical,
        "security_audit": record.security_audit,
    }


def get_auditor_name(audit: AuditorAudit) -> Optional[str]:
    """ดึงชื่อ Auditor จาก AuditorAudit → AuditorProfile → User"""
    try:
        user = audit.auditor.user
        return f"{user.first_name} {user.last_name}"
    except AttributeError:
        return None


# ════════════════════════════════════════════════════════
# SIDEBAR 1: แดชบอร์ด
# ════════════════════════════════════════════════════════

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    time_range: str = Query("30_days"),
    # ช่วงเวลา: "7_days" / "30_days" / "90_days" / "all"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    Sidebar 1 — แดชบอร์ด
    คืน: จำนวนเอกสารทั้งหมด + รอตรวจสอบ + กราฟรายเดือน (ปีนี้ vs ปีแล้ว)
    """
    auditor_profile = get_auditor_profile(current_user.id, db)

    # query พื้นฐาน: เอกสารที่ assigned ให้ auditor นี้ และยังไม่ถูกลบ
    base_q = (
        db.query(AuditorAudit)
        .join(RopaDocument, AuditorAudit.ropa_doc_id == RopaDocument.id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .filter(RopaDocument.deleted_at.is_(None))
        .filter(RopaDocument.sent_to_auditor_at.isnot(None))
    )

    # apply time_range filter บน stats (ไม่ใช้กับกราฟ)
    cutoff = get_time_cutoff(time_range)
    stats_q = base_q
    if cutoff:
        stats_q = stats_q.filter(RopaDocument.sent_to_auditor_at >= cutoff)

    all_audits = stats_q.all()

    total_documents = len(all_audits)
    # "รอตรวจสอบ" = ยังไม่ได้กรอก feedback เลย (ทั้ง owner และ processor ยัง pending)
    pending_review = sum(
        1 for a in all_audits
        if (a.owner_review_status or 'pending_review') == 'pending_review'
        and (a.processor_review_status or 'pending_review') == 'pending_review'
    )

    # ── กราฟรายเดือน: ดึงทุกปีไม่ filter time_range ──
    all_docs_audits = base_q.all()
    current_year = datetime.now(timezone.utc).year
    last_year = current_year - 1

    # นับจำนวนเอกสารต่อเดือนของแต่ละปี
    this_year_counts = {m: 0 for m in range(1, 13)}
    last_year_counts = {m: 0 for m in range(1, 13)}

    for audit in all_docs_audits:
        doc = audit.document
        if doc and doc.sent_to_auditor_at:
            sent = doc.sent_to_auditor_at
            if sent.year == current_year:
                this_year_counts[sent.month] += 1
            elif sent.year == last_year:
                last_year_counts[sent.month] += 1

    monthly_trend = [
        MonthlyTrend(
            month=m,
            this_year=this_year_counts[m],
            last_year=last_year_counts[m],
        )
        for m in range(1, 13)
    ]

    return DashboardResponse(
        total_documents=total_documents,
        pending_review=pending_review,
        monthly_trend=monthly_trend,
    )


# ════════════════════════════════════════════════════════
# SIDEBAR 2: เอกสาร
# ════════════════════════════════════════════════════════

@router.get("/documents", response_model=DocumentListResponse)
def get_documents(
    date_from: Optional[datetime] = Query(None),
    # กรองวันที่ได้รับ ตั้งแต่วันที่นี้เป็นต้นไป
    time_range: str = Query("30_days"),
    # ช่วงเวลา: "7_days" / "30_days" / "90_days" / "all"
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    Sidebar 2 — รายการเอกสาร
    คืน: stats (รอตอบกลับ) + ตาราง 2 แถวต่อ 1 เอกสาร (owner form + processor form)
    แถวแต่ละแถวมี action: "fill" (กรอกข้อเสนอแนะ) หรือ "view" (ดูข้อเสนอแนะ)
    """
    auditor_profile = get_auditor_profile(current_user.id, db)

    # query เอกสารที่ assigned ให้ auditor นี้
    base_q = (
        db.query(AuditorAudit)
        .join(RopaDocument, AuditorAudit.ropa_doc_id == RopaDocument.id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .filter(RopaDocument.deleted_at.is_(None))
        .filter(RopaDocument.sent_to_auditor_at.isnot(None))
    )

    # apply filters
    if date_from:
        base_q = base_q.filter(RopaDocument.sent_to_auditor_at >= date_from)
    cutoff = get_time_cutoff(time_range)
    if cutoff:
        base_q = base_q.filter(RopaDocument.sent_to_auditor_at >= cutoff)

    all_audits = base_q.order_by(RopaDocument.sent_to_auditor_at.desc()).all()

    # ── คำนวณ stats ──
    # "รอตอบกลับ" = แถวที่ยังไม่ได้ส่ง feedback (นับแยก owner/processor)
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    pending_count = 0
    pending_since_yesterday = 0
    for audit in all_audits:
        doc = audit.document
        received_today = (
            doc is not None
            and doc.sent_to_auditor_at is not None
            and doc.sent_to_auditor_at >= today_start
        )
        if (audit.owner_review_status or 'pending_review') == 'pending_review':
            pending_count += 1
            if received_today:
                pending_since_yesterday += 1
        if (audit.processor_review_status or 'pending_review') == 'pending_review':
            pending_count += 1
            if received_today:
                pending_since_yesterday += 1

    # ── สร้าง rows (2 แถวต่อ 1 เอกสาร) ──
    all_rows = []
    for audit in all_audits:
        doc = audit.document
        if not doc:
            continue
        doc_code = get_doc_code(doc)

        # แถว Owner form
        owner_status = audit.owner_review_status or 'pending_review'
        all_rows.append(DocumentListItem(
            ropa_doc_id=doc.id,
            doc_code=doc_code,
            title=doc.title,
            form_type="owner",
            form_label="ผู้รับผิดชอบข้อมูล",
            received_at=doc.sent_to_auditor_at,
            sent_at=audit.owner_feedback_sent_at,
            action="fill" if owner_status == 'pending_review' else "view",
            review_status=owner_status,
        ))

        # แถว Processor form
        proc_status = audit.processor_review_status or 'pending_review'
        all_rows.append(DocumentListItem(
            ropa_doc_id=doc.id,
            doc_code=doc_code,
            title=doc.title,
            form_type="processor",
            form_label="ผู้ประมวลผลข้อมูลส่วนบุคคล",
            received_at=doc.sent_to_auditor_at,
            sent_at=audit.processor_feedback_sent_at,
            action="fill" if proc_status == 'pending_review' else "view",
            review_status=proc_status,
        ))

    # pagination บน rows
    total = len(all_rows)
    offset = (page - 1) * page_size
    paginated_rows = all_rows[offset: offset + page_size]

    return DocumentListResponse(
        stats=DocumentStats(
            pending_feedback=pending_count,
            pending_since_yesterday=pending_since_yesterday,
        ),
        records=paginated_rows,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/documents/{ropa_doc_id}", response_model=FormResponse)
def get_document_form(
    ropa_doc_id: UUID,
    form_type: str = Query(..., description="'owner' หรือ 'processor'"),
    # บังคับส่ง ?type=owner หรือ ?type=processor
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    ดูฟอร์ม 6 ส่วน — ใช้เมื่อกดปุ่ม "กรอกข้อเสนอแนะ" หรือ "ดูข้อเสนอแนะ" ในตาราง
    - form_type=owner    → แสดงฟอร์มของ Data Owner (OwnerRecord)
    - form_type=processor → แสดงฟอร์มของ Data Processor (ProcessorRecord)
    คืน: header + ฟอร์ม 6 ส่วน (read-only) + feedback เดิมถ้ามี
    """
    auditor_profile = get_auditor_profile(current_user.id, db)

    # ── ตรวจสอบว่าเอกสารนี้ assigned ให้ auditor นี้ไหม ──
    audit = (
        db.query(AuditorAudit)
        .filter(AuditorAudit.ropa_doc_id == ropa_doc_id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .first()
    )
    if not audit:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารนี้ หรือไม่มีสิทธิ์เข้าถึง")

    doc = db.query(RopaDocument).filter(
        RopaDocument.id == ropa_doc_id,
        RopaDocument.deleted_at.is_(None),
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    doc_code = get_doc_code(doc)
    auditor_name = get_auditor_name(audit)

    if form_type == "owner":
        # ── ฟอร์ม Data Owner ──
        owner_record = db.query(OwnerRecord).filter(
            OwnerRecord.ropa_doc_id == ropa_doc_id
        ).first()
        if not owner_record:
            raise HTTPException(status_code=404, detail="ไม่พบข้อมูล Owner Record")
        form_data = build_owner_form_data(owner_record)
        last_modified = owner_record.updated_at
        review_status = audit.owner_review_status or 'pending_review'
        feedbacks = parse_feedback_json(audit.owner_feedback)
        form_label = "ผู้รับผิดชอบข้อมูล"

    elif form_type == "processor":
        # ── ฟอร์ม Data Processor ──
        processor_record = (
            db.query(ProcessorRecord)
            .filter(ProcessorRecord.ropa_doc_id == ropa_doc_id)
            .order_by(ProcessorRecord.created_at.desc())
            .first()
        )
        if not processor_record:
            raise HTTPException(status_code=404, detail="ไม่พบข้อมูล Processor Record")
        form_data = build_processor_form_data(processor_record)
        last_modified = processor_record.updated_at
        review_status = audit.processor_review_status or 'pending_review'
        feedbacks = parse_feedback_json(audit.processor_feedback)
        form_label = "ผู้ประมวลผลข้อมูลส่วนบุคคล"

    else:
        raise HTTPException(status_code=400, detail="form_type ต้องเป็น 'owner' หรือ 'processor'")

    return FormResponse(
        ropa_doc_id=doc.id,
        doc_code=doc_code,
        title=doc.title,
        last_modified=last_modified,
        auditor_name=auditor_name,
        form_type=form_type,
        form_label=form_label,
        review_status=review_status,
        form_data=form_data,
        feedbacks=[SectionFeedback(**f) for f in feedbacks],
    )


@router.post("/documents/{ropa_doc_id}/submit-feedback", response_model=SubmitFeedbackResponse)
def submit_feedback(
    ropa_doc_id: UUID,
    body: SubmitFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    ส่งข้อเสนอแนะ — ใช้เมื่อกดปุ่ม "ส่งข้อเสนอแนะ" ในหน้าฟอร์ม
    Logic:
      - feedbacks = [] → อนุมัติฟอร์มนั้น (requires expires_at)
        → ถ้าทั้ง 2 ฟอร์มอนุมัติแล้ว → document.status = APPROVED
      - feedbacks มีข้อมูล → ตีกลับ (NEEDS_REVISION)
        → ถ้า form_type=processor → ProcessorRecord.processor_status = NEEDS_REVISION
        → ถ้า form_type=owner → document.status = REJECTED_OWNER
    """
    auditor_profile = get_auditor_profile(current_user.id, db)
    now = datetime.now(timezone.utc)

    # ── ตรวจสอบ form_type ──
    if body.form_type not in ("owner", "processor"):
        raise HTTPException(400, detail="form_type ต้องเป็น 'owner' หรือ 'processor'")

    # ── หา AuditorAudit ──
    audit = (
        db.query(AuditorAudit)
        .filter(AuditorAudit.ropa_doc_id == ropa_doc_id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .first()
    )
    if not audit:
        raise HTTPException(404, detail="ไม่พบ audit record สำหรับเอกสารนี้")

    # ── หา RopaDocument ──
    doc = db.query(RopaDocument).filter(
        RopaDocument.id == ropa_doc_id,
        RopaDocument.deleted_at.is_(None),
    ).first()
    if not doc:
        raise HTTPException(404, detail="ไม่พบเอกสาร")

    is_approving = len(body.feedbacks) == 0

    if is_approving:
        # ── กรณีอนุมัติ ──
        if not body.expires_at:
            raise HTTPException(422, detail="กรุณาระบุ expires_at (วันหมดอายุ) เมื่ออนุมัติเอกสาร")

        if body.form_type == "owner":
            audit.owner_review_status = "approved"
            audit.owner_feedback_sent_at = now
            audit.owner_feedback = None  # ล้าง feedback เดิมถ้ามี
        else:
            audit.processor_review_status = "approved"
            audit.processor_feedback_sent_at = now
            audit.processor_feedback = None

        # กำหนดวันหมดอายุ
        doc.expires_at = body.expires_at

        # ── ตรวจสอบว่าทั้ง 2 ฟอร์มอนุมัติแล้วไหม ──
        owner_ok = (audit.owner_review_status or 'pending_review') == "approved"
        proc_ok = (audit.processor_review_status or 'pending_review') == "approved"
        if owner_ok and proc_ok:
            audit.audit_status = AuditStatus.APPROVED
            audit.approved_at = now
            doc.status = DocumentStatus.APPROVED

        db.commit()
        return SubmitFeedbackResponse(
            message="อนุมัติเอกสารเรียบร้อย",
            ropa_doc_id=ropa_doc_id,
            action="approved",
        )

    else:
        # ── กรณีตีกลับ (มี feedback) ──
        feedbacks_json = json.dumps(
            [f.model_dump() for f in body.feedbacks],
            ensure_ascii=False,
        )

        if body.form_type == "owner":
            audit.owner_feedback = feedbacks_json
            audit.owner_review_status = "needs_revision"
            audit.owner_feedback_sent_at = now
            # อัปเดตสถานะเอกสาร → ตีกลับให้ Owner
            doc.status = DocumentStatus.REJECTED_OWNER

        else:
            audit.processor_feedback = feedbacks_json
            audit.processor_review_status = "needs_revision"
            audit.processor_feedback_sent_at = now
            # อัปเดตสถานะเอกสาร → ตีกลับให้ Processor (ผ่าน Owner)
            doc.status = DocumentStatus.REJECTED_PROCESSOR
            # อัปเดต ProcessorRecord.processor_status = NEEDS_REVISION
            # เพื่อให้แสดงสถานะสีแดงใน Sidebar 1, 2 ของ Data Processor
            processor_record = (
                db.query(ProcessorRecord)
                .filter(ProcessorRecord.ropa_doc_id == ropa_doc_id)
                .order_by(ProcessorRecord.created_at.desc())
                .first()
            )
            if processor_record:
                processor_record.processor_status = ProcessorStatus.NEEDS_REVISION

        audit.audit_status = AuditStatus.NEEDS_REVISION
        audit.request_change_at = now

        db.commit()
        return SubmitFeedbackResponse(
            message="ส่งข้อเสนอแนะเรียบร้อย",
            ropa_doc_id=ropa_doc_id,
            action="needs_revision",
        )


# ════════════════════════════════════════════════════════
# SIDEBAR 3: เอกสารครบกำหนด
# ════════════════════════════════════════════════════════

@router.get("/expired-documents", response_model=ExpiredDocListResponse)
def get_expired_documents(
    date_from: Optional[datetime] = Query(None),
    time_range: str = Query("30_days"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    Sidebar 3 — เอกสารครบกำหนด
    แสดงเอกสารที่ expires_at <= วันนี้ (หมดอายุแล้ว)
    ลบเอกสารแล้วคือหายออกจาก DB เลย (hard delete) จึงแสดงเฉพาะที่ยังอยู่ในระบบ
    """
    auditor_profile = get_auditor_profile(current_user.id, db)
    now = datetime.now(timezone.utc)

    # เอกสารทั้งหมดที่ assigned ให้ auditor นี้ และหมดอายุแล้ว
    base_q = (
        db.query(RopaDocument)
        .join(AuditorAudit, AuditorAudit.ropa_doc_id == RopaDocument.id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .filter(RopaDocument.expires_at.isnot(None))
        .filter(RopaDocument.expires_at <= now)
    )

    # apply filters
    if date_from:
        base_q = base_q.filter(RopaDocument.expires_at >= date_from)
    cutoff = get_time_cutoff(time_range)
    if cutoff:
        base_q = base_q.filter(RopaDocument.expires_at >= cutoff)

    all_docs = base_q.all()

    # ── stats ──
    expired_count = len(all_docs)

    # deleted_count — นับจาก DeletedDocumentLog (hard delete → บันทึก log ก่อนลบ)
    deleted_q = db.query(DeletedDocumentLog).filter(
        DeletedDocumentLog.auditor_profile_id == auditor_profile.id
    )
    if date_from:
        deleted_q = deleted_q.filter(DeletedDocumentLog.deleted_at >= date_from)
    cutoff2 = get_time_cutoff(time_range)
    if cutoff2:
        deleted_q = deleted_q.filter(DeletedDocumentLog.deleted_at >= cutoff2)
    deleted_count = deleted_q.count()

    # เรียงตาม expires_at
    active_expired = sorted(all_docs, key=lambda d: d.expires_at or now)

    total = len(active_expired)
    offset = (page - 1) * page_size
    paginated = active_expired[offset: offset + page_size]

    records = [
        ExpiredDocItem(
            ropa_doc_id=d.id,
            doc_code=get_doc_code(d),
            title=d.title,
            expires_at=d.expires_at,
        )
        for d in paginated
    ]

    return ExpiredDocListResponse(
        stats=ExpiredDocStats(expired_count=expired_count, deleted_count=deleted_count),
        records=records,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/expired-documents/{ropa_doc_id}", response_model=FormResponse)
def get_expired_document_form(
    ropa_doc_id: UUID,
    form_type: str = Query("owner", description="'owner' หรือ 'processor'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    ดูฟอร์มเอกสารครบกำหนด — ใช้เมื่อกดปุ่ม "ดูเอกสาร" ใน Sidebar 3
    เหมือน GET /documents/{id} แต่:
    - ไม่มี feedback section (feedbacks = [])
    - ด้านล่างมีปุ่ม "ลบเอกสาร" แทน
    """
    auditor_profile = get_auditor_profile(current_user.id, db)

    audit = (
        db.query(AuditorAudit)
        .filter(AuditorAudit.ropa_doc_id == ropa_doc_id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .first()
    )
    if not audit:
        raise HTTPException(404, detail="ไม่พบเอกสารนี้")

    doc = db.query(RopaDocument).filter(RopaDocument.id == ropa_doc_id).first()
    if not doc:
        raise HTTPException(404, detail="ไม่พบเอกสาร")

    doc_code = get_doc_code(doc)
    auditor_name = get_auditor_name(audit)

    if form_type == "owner":
        owner_record = db.query(OwnerRecord).filter(
            OwnerRecord.ropa_doc_id == ropa_doc_id
        ).first()
        if not owner_record:
            raise HTTPException(404, detail="ไม่พบข้อมูล Owner Record")
        form_data = build_owner_form_data(owner_record)
        last_modified = owner_record.updated_at
        form_label = "ผู้รับผิดชอบข้อมูล"
    elif form_type == "processor":
        processor_record = (
            db.query(ProcessorRecord)
            .filter(ProcessorRecord.ropa_doc_id == ropa_doc_id)
            .order_by(ProcessorRecord.created_at.desc())
            .first()
        )
        if not processor_record:
            raise HTTPException(404, detail="ไม่พบข้อมูล Processor Record")
        form_data = build_processor_form_data(processor_record)
        last_modified = processor_record.updated_at
        form_label = "ผู้ประมวลผลข้อมูลส่วนบุคคล"
    else:
        raise HTTPException(400, detail="form_type ต้องเป็น 'owner' หรือ 'processor'")

    return FormResponse(
        ropa_doc_id=doc.id,
        doc_code=doc_code,
        title=doc.title,
        last_modified=last_modified,
        auditor_name=auditor_name,
        form_type=form_type,
        form_label=form_label,
        review_status="approved",   # เอกสารที่มาถึง Sidebar 3 ผ่านการอนุมัติแล้ว
        form_data=form_data,
        feedbacks=[],  # Sidebar 3 ไม่แสดง feedback section
    )


@router.delete("/documents/{ropa_doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    ropa_doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auditor),
):
    """
    ลบเอกสาร (Hard Delete) — ใช้เมื่อกดปุ่ม "ลบเอกสาร" แล้วยืนยัน
    ลบออกจาก DB จริงๆ (CASCADE → ลบ owner_record, processor_records, auditor_audits ด้วย)
    เอกสารจะหายไปถาวร หาคืนไม่ได้
    """
    auditor_profile = get_auditor_profile(current_user.id, db)

    # ตรวจสอบว่า auditor นี้มีสิทธิ์ลบเอกสารนี้ไหม
    audit = (
        db.query(AuditorAudit)
        .filter(AuditorAudit.ropa_doc_id == ropa_doc_id)
        .filter(AuditorAudit.assigned_auditor_id == auditor_profile.id)
        .first()
    )
    if not audit:
        raise HTTPException(403, detail="ไม่มีสิทธิ์ลบเอกสารนี้")

    doc = db.query(RopaDocument).filter(
        RopaDocument.id == ropa_doc_id,
    ).first()
    if not doc:
        raise HTTPException(404, detail="ไม่พบเอกสาร")

    # บันทึก log ก่อนลบ — เพื่อนับ deleted_count ใน Sidebar 3
    log = DeletedDocumentLog(
        ropa_doc_id=doc.id,
        doc_code=doc.doc_code,
        title=doc.title,
        auditor_profile_id=auditor_profile.id,
    )
    db.add(log)

    # Hard delete — ลบออกจาก DB จริง (CASCADE ลบ related records ทั้งหมด)
    db.delete(doc)
    db.commit()

    return {"message": "ลบเอกสารเรียบร้อย", "ropa_doc_id": str(ropa_doc_id)}
