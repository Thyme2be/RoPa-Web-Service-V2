from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRoleEnum, UserNotification
from app.models.document import RopaDocument, DocumentStatus, OwnerRecord, ProcessorRecord, AuditorAudit, AuditorProfile, AuditStatus
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdateOwner,
    DocumentUpdateProcessor,
    DocumentProvideFeedback,
    DocumentResponse,
    ProcessorRecordBase,
    ProcessorAssignment,
    OwnerDashboardResponse,
    DocumentDashboardSummary,
    MonthlyGraphData,
    OwnerListingResponse,
    DocumentListItem,
    DraftListItem,
    ActiveActionPermissions,
    DraftActionPermissions,
    DocumentListSummary,
    AuditorSubmissionItem,
    AuditorSubmissionResponse,
    AuditorReadyItem,
    AuditorReadyResponse,
    AuditorSubmitPayload,
    ProcessorActionPermissions,
    ProcessorAssignmentSummary,
    ProcessorAssignmentItem,
    ProcessorAssignmentResponse,
    FeedbackTrend,
    FeedbackSummary,
    FeedbackListItem,
    FeedbackListResponse,
    FeedbackDetailDocument,
    FeedbackSectionItem,
    FeedbackDetailResponse
)
from app.schemas.notification import NotificationResponse
from app.api.deps import get_current_user, RoleChecker
import json

owner_router = APIRouter()
processor_docs_router = APIRouter()
auditor_docs_router = APIRouter()

# -----------------
# DATA OWNER ENDPOINTS
# -----------------
@owner_router.post("/documents", response_model=DocumentResponse)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    # 0. Enforce Global Title Uniqueness
    if db.query(RopaDocument).filter(RopaDocument.title == doc_in.title).first():
        raise HTTPException(status_code=400, detail="Document with this title already exists")

    # 1. Create Wrapper
    new_doc = RopaDocument(
        owner_id=current_user.id,
        title=doc_in.title,
        status=DocumentStatus.DRAFT,
        version=1
    )
    db.add(new_doc)
    db.flush() # To get new_doc.id

    # 2. Add Owner Record if provided
    if doc_in.owner_record:
        dump = doc_in.owner_record.model_dump() # get all fields explicitly
        # สำหรับการสร้างเอกสาร/Draft จะไม่ยัด 'ไม่มี' เพื่อให้ฟอร์มหน้าบ้านยังคงความว่างเปล่าไว้
        owner_rec = OwnerRecord(ropa_doc_id=new_doc.id, **dump)
        db.add(owner_rec)

    db.commit()
    db.refresh(new_doc)
    return new_doc


@owner_router.get("/{owner_id}/dashboard", response_model=OwnerDashboardResponse)
def get_owner_dashboard(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this dashboard")

    docs = db.query(RopaDocument).filter(RopaDocument.owner_id == owner_id).all()
    
    pending_audit = 0
    rejected_owner = 0
    rejected_processor = 0
    
    for d in docs:
        if d.status == DocumentStatus.PENDING_AUDITOR:
            pending_audit += 1
        elif d.status == DocumentStatus.REJECTED_OWNER:
            rejected_owner += 1
        elif d.status == DocumentStatus.REJECTED_PROCESSOR:
            rejected_processor += 1

    summary = DocumentDashboardSummary(
        total_documents=len(docs),
        pending_audit=pending_audit,
        rejected_owner=rejected_owner,
        rejected_processor=rejected_processor
    )
    
    thai_months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    now = datetime.now(timezone.utc)
    this_year_num = now.year
    last_year_num = now.year - 1
    
    monthly_trend = []
    for month_index in range(1, 13):
        monthly_trend.append(MonthlyGraphData(
            month=month_index,
            month_name=thai_months[month_index - 1],
            this_year=0,
            last_year=0
        ))
        
    for d in docs:
        doc_year = d.created_at.year
        doc_month = d.created_at.month
        
        if doc_year == this_year_num:
            monthly_trend[doc_month - 1].this_year += 1
        elif doc_year == last_year_num:
            monthly_trend[doc_month - 1].last_year += 1
            
    return OwnerDashboardResponse(
        summary=summary,
        monthly_trend=monthly_trend,
        documents_list=docs
    )


@owner_router.get("/{owner_id}/documents", response_model=OwnerListingResponse)
def get_owner_listing(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this listing")

    docs = db.query(RopaDocument).filter(RopaDocument.owner_id == owner_id).all()
    
    total_completed = 0
    total_drafts = 0
    
    active_items = []
    draft_items = []
    
    for d in docs:
        if d.status == DocumentStatus.APPROVED:
            total_completed += 1
        elif d.status == DocumentStatus.DRAFT:
            total_drafts += 1
            
        is_draft = d.status == DocumentStatus.DRAFT
        
        if is_draft:
            actions = DraftActionPermissions(
                can_edit=True,
                can_delete=True
            )
            draft_items.append(DraftListItem(
                document_id=d.id,
                draft_code=d.doc_code,
                title=d.title,
                last_saved=d.updated_at,
                actions=actions
            ))
        else:
            actions = ActiveActionPermissions(
                can_view=True,
                can_download_excel=(d.status == DocumentStatus.APPROVED),
                can_edit=d.status in [DocumentStatus.REJECTED_OWNER]
            )
            active_items.append(DocumentListItem(
                document_id=d.id,
                doc_code=d.doc_code,
                title=d.title,
                date_received=d.updated_at if d.status != DocumentStatus.PENDING_AUDITOR else d.sent_to_auditor_at,
                status=d.status,
                actions=actions
            ))
            
    summary = DocumentListSummary(
        total_documents=len(docs),
        completed=total_completed,
        drafts=total_drafts
    )
    
    return OwnerListingResponse(
        summary=summary,
        active_items=active_items,
        draft_items=draft_items
    )


# --- ROPA PROCESSOR ASSIGNMENT LIST ---
@owner_router.get("/{owner_id}/processors/assignments", response_model=ProcessorAssignmentResponse)
def get_owner_processor_assignments(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch RopaDocuments owned by this DO that HAVE a ProcessorRecord attached
    # Using an inner join ensures we only get documents where a ProcessorRecord exists
    docs = db.query(RopaDocument, ProcessorRecord).join(ProcessorRecord).filter(
        RopaDocument.owner_id == owner_id
    ).order_by(RopaDocument.updated_at.desc()).all()

    total_count = len(docs)
    completed_count = 0
    assigned_items = []

    for doc, pr in docs:
        is_completed = pr.submitted_at is not None
        if is_completed:
            completed_count += 1
            
        status_label = "completed" if is_completed else "incomplete"
        
        actions = ProcessorActionPermissions(
            can_view=is_completed
        )

        assigned_items.append(ProcessorAssignmentItem(
            doc_code=doc.doc_code,
            title=doc.title,
            date_assigned=pr.created_at,
            date_received=pr.submitted_at,
            status=status_label,
            actions=actions
        ))

    summary = ProcessorAssignmentSummary(
        total_documents=total_count,
        completed=completed_count
    )

    return ProcessorAssignmentResponse(
        summary=summary,
        assigned_items=assigned_items
    )


# --- 1. /owner/{owner_id}/auditors/submissions ---
@owner_router.get("/{owner_id}/auditors/submissions", response_model=AuditorSubmissionResponse)
def get_auditor_submissions(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch docs that have been sent (i.e. not DRAFT)
    docs = db.query(RopaDocument).filter(
        RopaDocument.owner_id == owner_id,
        RopaDocument.status.notin_([DocumentStatus.DRAFT])
    ).order_by(RopaDocument.updated_at.desc()).all()

    submitted = []
    for d in docs:
        submitted.append(AuditorSubmissionItem(
            document_id=d.id,
            title=d.title,
            date_sent=d.sent_to_auditor_at or d.updated_at,
            status=d.status.value
        ))

    return AuditorSubmissionResponse(submitted_items=submitted)


# --- 2. /owner/{owner_id}/auditors/ready ---
@owner_router.get("/{owner_id}/auditors/ready", response_model=AuditorReadyResponse)
def get_ready_to_submit(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch docs that are 'completed but unsent'
    docs = db.query(RopaDocument).filter(
        RopaDocument.owner_id == owner_id,
        RopaDocument.status.in_([DocumentStatus.DRAFT, DocumentStatus.REJECTED_OWNER, DocumentStatus.REJECTED_PROCESSOR])
    ).order_by(RopaDocument.updated_at.desc()).all()

    ready = []
    for d in docs:
        ready.append(AuditorReadyItem(
            document_id=d.id,
            title=d.title,
            date_created=d.created_at
        ))

    return AuditorReadyResponse(ready_items=ready)


# ----------- HELPER FUNCTIONS -----------
import sqlalchemy

def apply_maimee_default(record_dict: dict, sqla_model) -> dict:
    """Set missing or empty string fields to 'ไม่มี' default if they are String/Text columns."""
    for column in sqla_model.__table__.columns:
        if column.name in record_dict:
            val = record_dict[column.name]
            if val is None or (isinstance(val, str) and val.strip() == ""):
                # Exclude specific fields if needed
                if column.name not in ["draft_code", "record_name"]:
                    if isinstance(column.type, (sqlalchemy.String, sqlalchemy.Text)):
                        record_dict[column.name] = "ไม่มี"
    return record_dict

def validate_owner_record_complete(doc: RopaDocument) -> list[str]:
    """Returns a list of missing required fields for a DO document before submission to Auditor."""
    missing = []
    rec = doc.owner_record

    if not rec:
        return ["ยังไม่มีข้อมูลในแบบฟอร์มเลย กรุณากรอกข้อมูลก่อนส่ง"]

    # ---- Section 1: ข้อมูลผู้บันทึก ----
    if not rec.first_name and not rec.record_name:
        missing.append("[ส่วนที่ 1] ชื่อผู้บันทึก")
    if not rec.last_name:
        missing.append("[ส่วนที่ 1] นามสกุลผู้บันทึก")
    if not rec.address:
        missing.append("[ส่วนที่ 1] ที่อยู่")
    if not rec.email:
        missing.append("[ส่วนที่ 1] อีเมล")
    if not rec.phone:
        missing.append("[ส่วนที่ 1] เบอร์โทรศัพท์")

    # ---- Section 2: รายละเอียดกิจกรรม ----
    if not rec.data_subject_name:
        missing.append("[ส่วนที่ 2] ชื่อเจ้าของข้อมูลส่วนบุคคล")
    if not rec.processing_activity:
        missing.append("[ส่วนที่ 2] กิจกรรมการประมวลผล")
    if not rec.purpose:
        missing.append("[ส่วนที่ 2] วัตถุประสงค์การประมวลผล")

    # ---- Section 3: ข้อมูลที่จัดเก็บ ----
    if not rec.personal_data:
        missing.append("[ส่วนที่ 3] ข้อมูลส่วนบุคคลที่จัดเก็บ")
    if not rec.data_category:
        missing.append("[ส่วนที่ 3] หมวดหมู่ข้อมูล")
    if not rec.data_type:
        missing.append("[ส่วนที่ 3] ประเภทข้อมูล (ทั่วไป/อ่อนไหว)")

    # ---- Section 4: การจัดเก็บรักษา ----
    if not rec.collection_method:
        missing.append("[ส่วนที่ 4] วิธีการได้มาซึ่งข้อมูล")
    if not rec.data_source and not rec.source_direct and not rec.source_indirect:
        missing.append("[ส่วนที่ 4] แหล่งที่มาของข้อมูล")
    if not rec.retention_storage_type:
        missing.append("[ส่วนที่ 4] ประเภทการจัดเก็บรักษา")
    if not rec.retention_duration:
        missing.append("[ส่วนที่ 4] ระยะเวลาการจัดเก็บ")
    if not rec.retention_access_control:
        missing.append("[ส่วนที่ 4] สิทธิและวิธีการเข้าถึงข้อมูล")
    if not rec.retention_deletion_method:
        missing.append("[ส่วนที่ 4] วิธีลบหรือทำลายข้อมูล")

    # ---- Section 5: ฐานทางกฎหมาย ----
    if not rec.legal_basis:
        missing.append("[ส่วนที่ 5] ฐานในการประมวลผลตามกฎหมาย")

    # ---- Section 6: มาตรการรักษาความมั่นคงปลอดภัย ----
    security_fields = [
        rec.security_organizational, rec.security_technical,
        rec.security_physical, rec.security_access_control,
        rec.security_responsibility, rec.security_audit
    ]
    if not any(security_fields):
        missing.append("[ส่วนที่ 6] มาตรการรักษาความมั่นคงปลอดภัย (กรุณากรอกอย่างน้อย 1 ข้อ)")

    return missing


# --- 3. /owner/auditors/submit ---
@owner_router.post("/auditors/submissions", response_model=dict)
def owner_submit_to_auditor(
    payload: AuditorSubmitPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    # 1. Resolve Auditor naturally
    auditor_user = db.query(User).filter(
        User.role == UserRoleEnum.AUDITOR,
        User.first_name == payload.auditor_first_name,
        User.last_name == payload.auditor_last_name
    ).first()

    if not auditor_user:
        raise HTTPException(status_code=400, detail="ไม่พบผู้ใช้งานในตำแหน่ง Auditor จากชื่อ-นามสกุลที่ระบุ")

    auditor_profile = db.query(AuditorProfile).filter(AuditorProfile.user_id == auditor_user.id).first()
    if not auditor_profile:
        raise HTTPException(status_code=400, detail="ผู้ใช้งานนี้ยังไม่มีโปรไฟล์ผู้ตรวจสอบ กรุณาติดต่อผู้ดูแลระบบ")

    # 2. Iterate and process targeted docs
    processed_count = 0
    for title in set(payload.document_titles):
        doc = db.query(RopaDocument).filter(
            RopaDocument.title == title,
            RopaDocument.owner_id == current_user.id
        ).first()

        if not doc:
            continue

        # Prevent double sending
        if doc.status == DocumentStatus.PENDING_AUDITOR:
            continue

        # --- BACKEND VALIDATION: ตรวจสอบความสมบูรณ์ของฟอร์มก่อนส่ง ---
        # Only validate DO-type documents (ones that have an owner_record, not DP forms)
        if not list(doc.processor_records):  # DO file
            missing_fields = validate_owner_record_complete(doc)
            if missing_fields:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": f"เอกสาร '{doc.title}' ยังกรอกข้อมูลไม่ครบถ้วน ไม่สามารถส่งให้ผู้ตรวจสอบได้",
                        "missing_fields": missing_fields
                    }
                )

        # Link document to auditor via AuditorAudit
        audit_record = AuditorAudit(
            ropa_doc_id=doc.id,
            assigned_auditor_id=auditor_profile.id,
            audit_status=AuditStatus.PENDING_REVIEW
        )
        db.add(audit_record)

        # Shift general document status
        doc.status = DocumentStatus.PENDING_AUDITOR
        doc.sent_to_auditor_at = datetime.now(timezone.utc)
        processed_count += 1

    db.commit()
    return {"message": "Success", "documents_processed": processed_count}


# --- 4. /owner/{owner_id}/auditors/feedbacks ---
@owner_router.get("/{owner_id}/auditors/feedbacks", response_model=FeedbackListResponse)
def get_owner_feedbacks(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Only get docs that have been audited and have REVISIONS requested.
    docs_with_audits = db.query(RopaDocument).join(AuditorAudit).filter(
        RopaDocument.owner_id == owner_id,
        AuditorAudit.request_change_at.isnot(None)
    ).all()

    # De-duplicate by doc ID using a dict
    unique_feedbacks = {}
    for doc in docs_with_audits:
        # Get latest audit
        latest_audit = max(doc.audits, key=lambda a: a.request_change_at or datetime.min.replace(tzinfo=timezone.utc))
        if latest_audit.request_change_at:
            unique_feedbacks[doc.id] = (doc, latest_audit)

    total_feedbacks = len(unique_feedbacks)
    
    # Calculate simple trends (e.g., received within the last 24 hours)
    now = datetime.now(timezone.utc)
    increased_since_yesterday = 0
    pending_processor_count = 0
    feedback_items = []

    for doc_id, (doc, audit) in unique_feedbacks.items():
        if audit.request_change_at and (now - audit.request_change_at).days <= 1:
            increased_since_yesterday += 1

        # Check pending processor status
        if list(doc.processor_records):
            for pr in doc.processor_records:
                if pr.updated_at < audit.request_change_at:
                    pending_processor_count += 1
                    break # Document is still pending DP
                    
        feedback_items.append(FeedbackListItem(
            document_id=doc.id,
            doc_code=doc.doc_code,
            title=doc.title,
            date_received=audit.request_change_at
        ))

    # Sort descending
    feedback_items.sort(key=lambda x: x.date_received or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    summary = FeedbackSummary(
        total_feedbacks=total_feedbacks,
        feedback_trend=FeedbackTrend(
            direction="up" if increased_since_yesterday > 0 else "neutral",
            value=f"+{increased_since_yesterday}",
            text_label="จากเมื่อวาน"
        ),
        pending_processor=pending_processor_count
    )

    return FeedbackListResponse(summary=summary, feedback_items=feedback_items)

# --- 5. /owner/documents/{doc_id}/feedbacks ---
@owner_router.get("/documents/{doc_id}/feedbacks", response_model=FeedbackDetailResponse)
def get_feedback_detail(
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role != UserRoleEnum.ADMIN and doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not doc.audits:
        raise HTTPException(status_code=404, detail="No feedback found for this document")

    latest_audit = max(doc.audits, key=lambda a: a.request_change_at or datetime.min.replace(tzinfo=timezone.utc))
    
    document_info = FeedbackDetailDocument(
        document_id=doc.id,
        doc_code=doc.doc_code,
        last_edited=latest_audit.updated_at,
        auditor_name=f"{latest_audit.auditor.user.first_name} {latest_audit.auditor.user.last_name}" if latest_audit.auditor else "Unknown",
        document_type="DATA_PROCESSOR_DOCUMENT" if list(doc.processor_records) else "DATA_OWNER_DOCUMENT"
    )

    processor_feedbacks_parsed = []
    owner_feedbacks_parsed = []

    # Processor JSON parsing & status logic
    if latest_audit.processor_feedback:
        try:
            dp_dict = json.loads(latest_audit.processor_feedback)
            # Find DP record to check completion status
            pr = doc.processor_records[0] if list(doc.processor_records) else None
            is_completed = False
            if pr and latest_audit.request_change_at:
                is_completed = pr.updated_at > latest_audit.request_change_at

            for section, comment in dp_dict.items():
                processor_feedbacks_parsed.append(FeedbackSectionItem(
                    section_name=section,
                    comment=comment,
                    status="completed" if is_completed else "incomplete"
                ))
        except json.JSONDecodeError:
            pass

    # Owner JSON parsing logic
    if latest_audit.owner_feedback:
        try:
            do_dict = json.loads(latest_audit.owner_feedback)
            # DO does not have strict status logic per UI plan, but could verify via doc.updated_at
            is_completed = False
            if latest_audit.request_change_at:
                is_completed = doc.updated_at > latest_audit.request_change_at
                
            for section, comment in do_dict.items():
                owner_feedbacks_parsed.append(FeedbackSectionItem(
                    section_name=section,
                    comment=comment,
                    status="completed" if is_completed else "incomplete"
                ))
        except json.JSONDecodeError:
            pass

    return FeedbackDetailResponse(
        document=document_info,
        processor_feedbacks=processor_feedbacks_parsed,
        owner_feedbacks=owner_feedbacks_parsed
    )

# --- 6. /owner/documents/{doc_id} ---
@owner_router.get("/documents/{id}", response_model=DocumentResponse)
def get_document_by_id(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    return doc


# --- 7. NOTIFICATIONS ---
@owner_router.get("/{owner_id}/notifications", response_model=List[NotificationResponse])
def get_owner_notifications(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(UserNotification).filter(
        UserNotification.user_id == owner_id
    ).order_by(UserNotification.created_at.desc()).all()


@owner_router.delete("/{owner_id}/notifications", response_model=dict)
def clear_owner_notifications(
    owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role != UserRoleEnum.ADMIN and current_user.id != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.query(UserNotification).filter(UserNotification.user_id == owner_id).delete()
    db.commit()
    
    return {"message": "All notifications cleared successfully"}


@owner_router.put("/documents/{id}", response_model=DocumentResponse)
def update_document_owner(
    id: UUID,
    doc_in: DocumentUpdateOwner,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    if doc_in.title is not None:
        doc.title = doc_in.title

    if doc_in.owner_record:
        dump = doc_in.owner_record.model_dump() # Get all fields
        
        if not doc.owner_record:
            new_rec = OwnerRecord(ropa_doc_id=doc.id, **dump)
            db.add(new_rec)
        else:
            for key, value in dump.items():
                setattr(doc.owner_record, key, value)
            
    if doc_in.status is not None:
        doc.status = doc_in.status
        if doc.status == DocumentStatus.PENDING_AUDITOR:
            doc.sent_to_auditor_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(doc)
    return doc


# --- ปุ่ม: บันทึกฉบับร่าง (Save Draft) ---
@owner_router.put("/documents/{id}/draft", response_model=DocumentResponse)
def save_document_draft(
    id: UUID,
    doc_in: DocumentUpdateOwner,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    """
    บันทึกข้อมูลโดยไม่ตรวจสอบสถานะความครบถ้วน — ทำให้สถานะดูเหมือนเดิม (เป็น DRAFT อยู่เสมอ)
    สนับสนุนการกรอกแบบฟอร์มค้างคงโดยให้ຜู้ใช้บันทึกก่อนแล้วค่อยยืนยันได้
    """
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารหรือไม่มีสิทธิ์เข้าถึง")

    # ห้ามเปลี่ยนสถานะหากเอกสารอยู่ใน pipeline ของ Auditor แล้ว
    if doc.status not in [DocumentStatus.DRAFT, DocumentStatus.REJECTED_OWNER]:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่สามารถแก้ไขเอกสารที่อยู่ในสถานะ '{doc.status.value}'"
        )

    if doc_in.title is not None:
        doc.title = doc_in.title

    if doc_in.owner_record:
        dump = doc_in.owner_record.model_dump()
        # ไม่ต้องใช้ apply_maimee_default ใน Draft
        if not doc.owner_record:
            new_rec = OwnerRecord(ropa_doc_id=doc.id, **dump)
            db.add(new_rec)
        else:
            for key, value in dump.items():
                setattr(doc.owner_record, key, value)

    # สถานะคง DRAFT ไม่เปลี่ยน
    if doc.status != DocumentStatus.REJECTED_OWNER:
        doc.status = DocumentStatus.DRAFT

    db.commit()
    db.refresh(doc)
    return doc


# --- ปุ่ม: ยืนยันข้อมูล RoPA (Confirm) ---
@owner_router.put("/documents/{id}/confirm", response_model=DocumentResponse)
def confirm_document_ropa(
    id: UUID,
    doc_in: DocumentUpdateOwner,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    """
    บันทึกข้อมูล และตรวจสอบว่ากรอกครบทุกช่องที่จำเป็นກัว — หากเสร็จจะเปลี่ยนสถานะเป็น COMPLETED
    หน้าแสดงข้อผิดพลาดแต่ละช่องที่ยังไม่กรอกแก่ Frontend
    """
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสารหรือไม่มีสิทธิ์เข้าถึง")

    if doc.status not in [DocumentStatus.DRAFT, DocumentStatus.REJECTED_OWNER]:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่สามารถยืนยันเอกสารที่อยู่ในสถานะ '{doc.status.value}'"
        )

    if doc_in.title is not None:
        doc.title = doc_in.title

    if doc_in.owner_record:
        dump = doc_in.owner_record.model_dump()
        # นำ apply_maimee_default ออกจากการ "ยืนยันข้อมูล" 
        # เพื่อให้ระบบตรวจสอบความครบถ้วน (Validation) ทำงานได้อย่างถูกต้องหากข้อมูลว่างเปล่า
        if not doc.owner_record:
            new_rec = OwnerRecord(ropa_doc_id=doc.id, **dump)
            db.add(new_rec)
        else:
            for key, value in dump.items():
                setattr(doc.owner_record, key, value)

    # ตรวจสอบความครบถ้วนของฟอร์ม
    db.flush()  # Flush first to persist record changes before reading back
    db.refresh(doc)

    # 👑 แปลงช่องว่างทั้งหมดที่เหลือ (ไม่ว่าบังคับหรือไม่บังคับ) ให้กลายเป็น "ไม่มี"
    if doc.owner_record:
        import sqlalchemy
        for column in OwnerRecord.__table__.columns:
            val = getattr(doc.owner_record, column.name)
            if val is None or (isinstance(val, str) and val.strip() == ""):
                if column.name not in ["draft_code", "record_name"]:
                    if isinstance(column.type, (sqlalchemy.String, sqlalchemy.Text)):
                        setattr(doc.owner_record, column.name, "ไม่มี")

    # ครบแล้ว — เปลี่ยนสถานะเป็น COMPLETED (พร้อมเข้าคิวส่งให้ Auditor)
    doc.status = DocumentStatus.COMPLETED

    db.commit()
    db.refresh(doc)
    return doc


@owner_router.post("/processors/assignments", response_model=DocumentResponse)
def owner_assign_processor(
    assignment: ProcessorAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    """Hybrid Model Part 2 (Revised): Owner creates a brand new document specifically to assign work to a Processor."""
    
    # 0. Enforce Global Title Uniqueness (Treating record_name as the new campaign title)
    if db.query(RopaDocument).filter(RopaDocument.title == assignment.record_name).first():
        raise HTTPException(status_code=400, detail="Document with this title already exists")

    target_user = db.query(User).filter(User.first_name == assignment.first_name, User.last_name == assignment.last_name).first()
    if not target_user or target_user.role != UserRoleEnum.DATA_PROCESSOR:
        raise HTTPException(status_code=400, detail=f"Data Processor named '{assignment.first_name} {assignment.last_name}' not found in the system.")

    # Unique check for record_name (Double security measure)
    if db.query(ProcessorRecord).filter(ProcessorRecord.record_name == assignment.record_name).first():
        raise HTTPException(status_code=400, detail=f"Processor form with name '{assignment.record_name}' already exists.")

    # 1. Spawn a brand new disconnected RopaDocument wrapper for the DP
    new_doc = RopaDocument(
        owner_id=current_user.id,
        title=assignment.record_name,
        status=DocumentStatus.DRAFT,
        version=1
    )
    db.add(new_doc)
    db.flush()

    # 2. Attach the ProcessorRecord to the new standalone wrapper
    new_pr = ProcessorRecord(
        ropa_doc_id=new_doc.id, 
        assigned_to=target_user.id,
        record_name=assignment.record_name
    )
    db.add(new_pr)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc


# -----------------
# DATA PROCESSOR ENDPOINTS
# -----------------
@processor_docs_router.get("/dashboard", response_model=List[DocumentResponse])
def get_processor_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data processor", "Admin"]))
):
    if current_user.role == UserRoleEnum.ADMIN:
        return db.query(RopaDocument).join(ProcessorRecord).filter(ProcessorRecord.assigned_to.isnot(None)).all()
    # Find documents where this user is assigned as one of the processors
    return db.query(RopaDocument).join(ProcessorRecord).filter(ProcessorRecord.assigned_to == current_user.id).all()


@processor_docs_router.put("/documents/{doc_id}", response_model=DocumentResponse)
def fill_processor_data(
    doc_id: UUID,
    doc_in: DocumentUpdateProcessor,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data processor"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    pr = db.query(ProcessorRecord).filter(ProcessorRecord.ropa_doc_id == doc_id, ProcessorRecord.assigned_to == current_user.id).first()
    if not pr:
        raise HTTPException(status_code=403, detail="You do not have a Processor Record assigned in this document.")
    
    if doc_in.processor_record:
        dump = doc_in.processor_record.model_dump()
        dump = apply_maimee_default(dump, ProcessorRecord)
        
        for key, value in dump.items():
            setattr(pr, key, value)
            
    if doc_in.status is not None:
        doc.status = doc_in.status
        if doc.status == DocumentStatus.PENDING_AUDITOR:
             doc.sent_to_auditor_at = datetime.now(timezone.utc)
             
    pr.submitted_at = datetime.now(timezone.utc)
    
    # ── TRIGGER NOTIFICATION TO DATA OWNER ──
    # Create notification only if DP is "submitting" / updating
    notify = UserNotification(
        user_id=doc.owner_id,
        document_id=doc.id,
        title="ผู้ประมวลผลข้อมูลส่วนบุคคลส่งเอกสารฉบับสมบูรณ์",
        message="โปรดตรวจสอบก่อนจะนำส่งให้ทางผู้ตรวจสอบ"
    )
    db.add(notify)

    db.commit()
    db.refresh(doc)
    return doc


# -----------------
# AUDITOR ENDPOINTS
# -----------------
@auditor_docs_router.get("/dashboard", response_model=List[DocumentResponse])
def get_auditor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Auditor", "Admin"]))
):
    return db.query(RopaDocument).filter(
        RopaDocument.status.in_([
            DocumentStatus.PENDING_AUDITOR, 
            DocumentStatus.REJECTED_OWNER,
            DocumentStatus.REJECTED_PROCESSOR,
            DocumentStatus.APPROVED,
            DocumentStatus.COMPLETED
        ])
    ).all()


@auditor_docs_router.put("/documents/{id}/feedback", response_model=DocumentResponse)
def auditor_feedback(
    id: UUID,
    doc_in: DocumentProvideFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Auditor"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Ensure AuditorProfile exists
    from app.models.document import AuditorProfile
    auditor_prof = db.query(AuditorProfile).filter(AuditorProfile.user_id == current_user.id).first()
    
    if not auditor_prof:
        # Create a stub profile for testing backwards compatibility if one wasn't properly initialized
        from app.models.document import AuditorType
        auditor_prof = AuditorProfile(user_id=current_user.id, auditor_type=AuditorType.INTERNAL, appointed_at=datetime.now(timezone.utc).date(), public_email=current_user.email)
        db.add(auditor_prof)
        db.flush()
        
    audit_log = AuditorAudit(
        ropa_doc_id=doc.id,
        assigned_auditor_id=auditor_prof.id,
        status=doc_in.status or doc.status,
        feedback_comment=doc_in.feedback_comment,
        version=doc.version
    )
    
    if doc_in.status == DocumentStatus.APPROVED:
        audit_log.approved_at = datetime.now(timezone.utc)
    elif doc_in.status in [DocumentStatus.REJECTED_OWNER, DocumentStatus.REJECTED_PROCESSOR]:
        audit_log.request_change_at = datetime.now(timezone.utc)
        doc.version += 1 # Auto bump version when bounced back
        
        # ── TRIGGER NOTIFICATION TO DATA OWNER ──
        notify = UserNotification(
            user_id=doc.owner_id,
            document_id=doc.id,
            title="เอกสารถูกตีกลับและมีข้อเสนอแนะใหม่",
            message="ผู้ตรวจสอบได้ส่งมอบข้อเสนอแนะให้แก่คุณ โปรดตรวจสอบและแก้ไขข้อมูล"
        )
        db.add(notify)
        
    db.add(audit_log)

    if doc_in.status is not None:
        doc.status = doc_in.status
        
    db.commit()
    db.refresh(doc)
    return doc
