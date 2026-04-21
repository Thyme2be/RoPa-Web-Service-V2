"""
owner.py ─ Data Owner API endpoints

ครอบคลุมทุก route ที่ Data Owner ใช้งาน:

  สร้างเอกสาร:
    POST   /owner/documents                                   สร้างเอกสาร + sections + assign DP

  Dashboard:
    GET    /owner/dashboard                                   สรุปสถิติ + card ต่าง ๆ

  ตาราง 4 ประเภท:
    GET    /owner/tables/active                               ตาราง 1 – เอกสาร Active (IN_PROGRESS)
    GET    /owner/tables/sent-to-dpo                         ตาราง 2 – ส่ง DPO แล้ว (UNDER_REVIEW)
    GET    /owner/tables/approved                             ตาราง 3 – DPO อนุมัติแล้ว (COMPLETED)
    GET    /owner/tables/destroyed                            ตาราง 4 – ถูกทำลายแล้ว (DELETED)

  Owner Section (Tab 1):
    GET    /owner/documents/{id}/section                      ดู/กรอก Owner Section (ครบทุก field)
    PATCH  /owner/documents/{id}/section                      บันทึกฉบับร่าง (ไม่เปลี่ยน status)
    POST   /owner/documents/{id}/section/submit               บันทึก = เปลี่ยน status เป็น SUBMITTED

  ส่งเอกสาร:
    POST   /owner/documents/{id}/send-to-dpo                  ส่งให้ DPO (ตาราง 1 )
    POST   /owner/documents/{id}/send-back-to-dpo             ส่งการแก้ไขคืน DPO (ตาราง 2 )
    POST   /owner/documents/{id}/annual-review                ส่งตรวจสอบรายปี (ตาราง 3 )

  Processor Section (Tab 2 – DO ดู read-only + feedback):
    GET    /owner/documents/{id}/processor-section            ดู Processor Section ของ DP
    PATCH  /owner/documents/{id}/processor-section/suggestion แก้ไข do_suggestion
    POST   /owner/documents/{id}/processor-section/feedback   ส่ง feedback batch ให้ DP

  Risk Assessment (Tab 3):
    GET    /owner/documents/{id}/risk                         ดู Risk Assessment
    POST   /owner/documents/{id}/risk                         สร้าง/อัปเดต (ยืนยันการประเมิน)

  Deletion Request (Tab 4):
    GET    /owner/documents/{id}/deletion                     ดูสถานะคำร้องขอทำลาย
    POST   /owner/documents/{id}/deletion                     ยื่นคำร้องขอทำลายเอกสาร
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID
import logging
import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.core.rbac import Role, check_document_access, require_roles
from app.models.assignment import ProcessorAssignmentModel
from app.models.document import (
    DocumentDeletionRequestModel,
    RopaDocumentModel,
    RopaRiskAssessmentModel,
)
from app.models.section_owner import (
    OwnerCollectionMethodModel,
    OwnerDataCategoryModel,
    OwnerDataSourceModel,
    OwnerDataTypeModel,
    OwnerMinorConsentTypeModel,
    OwnerPersonalDataItemModel,
    OwnerStorageMethodModel,
    OwnerStorageTypeModel,
    RopaOwnerSectionModel,
)
from app.models.section_snapshots import RopaOwnerSnapshotModel

from app.models.section_processor import RopaProcessorSectionModel
from app.models.user import UserModel
from app.models.dpo_comment import DpoSectionCommentModel
from app.models.workflow import (
    DocumentReviewCycleModel,
    ReviewAssignmentModel,
    ReviewDpoAssignmentModel,
    ReviewFeedbackModel,
)
from app.schemas.enums import (
    ReviewAssignmentStatusEnum,
    ReviewStatusEnum,
    RopaSectionEnum,
)
from app.schemas.owner import (
    ActiveTableItem,
    ApprovedTableItem,
    DestroyedTableItem,
    DeletionRequestCreate,
    DeletionRequestRead,
    DocumentCreateOwner,
    ProcessorCompaniesResponse,
    ProcessorAvailabilityResponse,
    DoSuggestionUpdate,
    DoSuggestionResponse,
    FeedbackBatch,
    FeedbackRead,
    MessageResponse,
    OwnerDashboardResponse,
    OwnerSectionFullRead,
    OwnerSectionSave,
    OwnerStatusBadge,
    ProcessorStatusBadge,
    RiskAssessmentRead,
    RiskAssessmentSubmit,
    SendToDpoPayload,
    SendToDpoResponse,
    AnnualReviewResponse,
    SentToDpoTableItem,
    PersonalDataItemOut,
    DataCategoryOut,
    DataTypeOut,
    CollectionMethodOut,
    DataSourceOut,
    StorageTypeOut,
    StorageMethodOut,
    OwnerSnapshotRead,
    OwnerSnapshotTableItem,
)

from app.schemas.processor import ProcessorSectionFullRead
from app.api.routers.processor import _load_processor_section_full, _processor_status_badge as _dp_view_badge
from app.schemas.user import UserRead

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/owner", tags=["Data Owner"])


# =============================================================================
# Helper: Generate Document Number
# =============================================================================

def _generate_document_number(db: Session, prefix: str = "RP") -> str:
    """
    สร้างเลขเอกสารรูปแบบ RP-XXXXXX โดยที่ XXXXXX เป็นเลขสุ่ม 6 หลัก
    และตรวจสอบว่าไม่ซ้ำในฐานข้อมูล
    """
    while True:
        # สุ่มเลข 4 หลัก และ 2 หลัก คั่นด้วยขีด
        part1 = "".join(random.choices(string.digits, k=4))
        part2 = "".join(random.choices(string.digits, k=2))
        doc_number = f"{prefix}-{part1}-{part2}"
        
        # ตรวจสอบความซ้ำซ้อน
        exists = db.query(RopaDocumentModel.id).filter(
            RopaDocumentModel.document_number == doc_number
        ).first()
        
        if not exists:
            return doc_number


def _user_full_name(user: Optional[UserModel]) -> Optional[str]:
    """คืนชื่อเต็มของ user หรือ None ถ้าไม่มี"""
    if not user:
        return None
    parts = [user.first_name, user.last_name]
    name = " ".join(p for p in parts if p)
    return name or user.username or None


# =============================================================================
# Helper: Load OwnerSectionFullRead with sub-tables
# =============================================================================

def _load_owner_section_full(section: RopaOwnerSectionModel, db: Session) -> OwnerSectionFullRead:
    """
    โหลด Owner Section พร้อม sub-tables ทั้งหมด
    เพราะ SQLAlchemy ไม่ได้ define relationship ไว้ใน model จึงต้อง query แยก
    """
    sid = section.id

    personal_data_items = db.query(OwnerPersonalDataItemModel).filter_by(owner_section_id=sid).all()
    data_categories     = db.query(OwnerDataCategoryModel).filter_by(owner_section_id=sid).all()
    data_types          = db.query(OwnerDataTypeModel).filter_by(owner_section_id=sid).all()
    collection_methods  = db.query(OwnerCollectionMethodModel).filter_by(owner_section_id=sid).all()
    data_sources        = db.query(OwnerDataSourceModel).filter_by(owner_section_id=sid).all()
    storage_types       = db.query(OwnerStorageTypeModel).filter_by(owner_section_id=sid).all()
    storage_methods     = db.query(OwnerStorageMethodModel).filter_by(owner_section_id=sid).all()

    # minor_consent_types = list ของ string ตรงกับ 3 checkbox ใน UI
    consent_type_rows = db.query(OwnerMinorConsentTypeModel).filter_by(owner_section_id=sid).all()
    minor_consent_types_out = [ct.type for ct in consent_type_rows]

    return OwnerSectionFullRead(
        id=section.id,
        document_id=section.document_id,
        owner_id=section.owner_id,
        status=section.status,
        updated_at=section.updated_at,
        title_prefix=section.title_prefix,
        first_name=section.first_name,
        last_name=section.last_name,
        address=section.address,
        email=section.email,
        phone=section.phone,
        contact_email=section.contact_email,
        company_phone=section.company_phone,
        data_owner_name=section.data_owner_name,
        processing_activity=section.processing_activity,
        purpose_of_processing=section.purpose_of_processing,
        personal_data_items=[PersonalDataItemOut.model_validate(x) for x in personal_data_items],
        data_categories=[DataCategoryOut.model_validate(x) for x in data_categories],
        data_types=[DataTypeOut.model_validate(x) for x in data_types],
        collection_methods=[CollectionMethodOut.model_validate(x) for x in collection_methods],
        data_sources=[DataSourceOut.model_validate(x) for x in data_sources],
        storage_types=[StorageTypeOut.model_validate(x) for x in storage_types],
        storage_methods=[StorageMethodOut.model_validate(x) for x in storage_methods],
        data_source_other=section.data_source_other,
        retention_value=section.retention_value,
        retention_unit=section.retention_unit,
        access_control_policy=section.access_control_policy,
        deletion_method=section.deletion_method,
        legal_basis=section.legal_basis,
        has_cross_border_transfer=section.has_cross_border_transfer,
        transfer_country=section.transfer_country,
        transfer_in_group=section.transfer_in_group,
        transfer_method=section.transfer_method,
        transfer_protection_standard=section.transfer_protection_standard,
        transfer_exception=section.transfer_exception,
        exemption_usage=section.exemption_usage,
        refusal_handling=section.refusal_handling,
        minor_consent_types=minor_consent_types_out,
        org_measures=section.org_measures,
        access_control_measures=section.access_control_measures,
        technical_measures=section.technical_measures,
        responsibility_measures=section.responsibility_measures,
        physical_measures=section.physical_measures,
        audit_measures=section.audit_measures,
    )


# =============================================================================
# Helper: Save sub-tables (replace-all pattern)
# =============================================================================

def _replace_owner_sub_tables(section_id: UUID, payload: OwnerSectionSave, db: Session):
    """
    อัปเดต sub-tables โดยลบของเก่าทั้งหมด แล้ว insert ใหม่
    เรียกเฉพาะ field ที่ payload ส่งมา (ไม่ใช่ None)
    """
    if payload.personal_data_items is not None:
        db.query(OwnerPersonalDataItemModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.personal_data_items:
            db.add(OwnerPersonalDataItemModel(owner_section_id=section_id, **item.model_dump()))

    if payload.data_categories is not None:
        db.query(OwnerDataCategoryModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_categories:
            db.add(OwnerDataCategoryModel(owner_section_id=section_id, **item.model_dump()))

    if payload.data_types is not None:
        db.query(OwnerDataTypeModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_types:
            db.add(OwnerDataTypeModel(owner_section_id=section_id, **item.model_dump()))

    if payload.collection_methods is not None:
        db.query(OwnerCollectionMethodModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.collection_methods:
            db.add(OwnerCollectionMethodModel(owner_section_id=section_id, **item.model_dump()))

    if payload.data_sources is not None:
        db.query(OwnerDataSourceModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_sources:
            db.add(OwnerDataSourceModel(owner_section_id=section_id, **item.model_dump()))

    if payload.storage_types is not None:
        db.query(OwnerStorageTypeModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.storage_types:
            db.add(OwnerStorageTypeModel(owner_section_id=section_id, **item.model_dump()))

    if payload.storage_methods is not None:
        db.query(OwnerStorageMethodModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.storage_methods:
            db.add(OwnerStorageMethodModel(owner_section_id=section_id, **item.model_dump()))

    if payload.minor_consent_types is not None:
        db.query(OwnerMinorConsentTypeModel).filter_by(owner_section_id=section_id).delete()
        for t in payload.minor_consent_types:
            db.add(OwnerMinorConsentTypeModel(owner_section_id=section_id, type=t))


# =============================================================================
# Helper: Owner/Processor status badge logic
# =============================================================================

def _owner_status_badge(
    doc: RopaDocumentModel,
    owner_section: Optional[RopaOwnerSectionModel],
    review_assignment: Optional[ReviewAssignmentModel],
) -> OwnerStatusBadge:
    if owner_section and owner_section.status == RopaSectionEnum.SUBMITTED:
        return OwnerStatusBadge(label="Data Owner ดำเนินการเสร็จสิ้น", code="DO_DONE")
    return OwnerStatusBadge(label="รอส่วนของ Data Owner", code="WAITING_DO")


def _processor_status_badge(
    processor_section: Optional[RopaProcessorSectionModel],
    review_assignment: Optional[ReviewAssignmentModel],
) -> ProcessorStatusBadge:
    """
    badge สถานะ DP ใน ตาราง 1 (มุมมอง DO) — 2 ค่า:
      DP_DONE    = ส่งให้ DO แล้ว (is_sent=True)
      WAITING_DP = ยังไม่ได้ส่ง หรือ กำลังกรอก (is_sent=False)
    """
    if processor_section and processor_section.is_sent:
        return ProcessorStatusBadge(label="Data Processor ดำเนินการเสร็จสิ้น", code="DP_DONE")
    return ProcessorStatusBadge(label="รอส่วนของ Data Processor", code="WAITING_DP")


# =============================================================================
# POST /owner/documents — สร้างเอกสารใหม่
# =============================================================================

@router.get(
    "/processors/companies",
    response_model=ProcessorCompaniesResponse,
    summary="ดึงรายชื่อบริษัท DP ทั้งหมด (สำหรับ dropdown ตอนสร้างเอกสาร)",
)
def list_processor_companies(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    คืนรายชื่อบริษัทที่มี PROCESSOR user อยู่ → frontend เอาไปทำ dropdown ในหน้าสร้างเอกสาร
    """
    rows = (
        db.query(UserModel.company_name)
        .filter(
            UserModel.company_name.isnot(None),
            UserModel.status == "ACTIVE",
        )
        .distinct()
        .order_by(UserModel.company_name)
        .all()
    )
    return {"companies": [r.company_name for r in rows]}


@router.get(
    "/processors/check-availability",
    response_model=ProcessorAvailabilityResponse,
    summary="ตรวจสอบว่าบริษัทนั้นมี active PROCESSOR หรือไม่ (Real-time validation)",
)
def check_processor_availability(
    company_name: str,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    ตรวจสอบความพร้อมของ DP ในบริษัทรายที่ระบุ
    """
    exists = db.query(UserModel).filter(
        UserModel.role == "PROCESSOR",
        func.lower(UserModel.company_name) == func.lower(company_name),
        UserModel.status == "ACTIVE"
    ).first() is not None
    
    return {"available": exists, "message": None if exists else "ไม่พบผู้ประมวลผลข้อมูลส่วนบุคคลในบริษัทนี้"}


@router.post(
    "/documents",
    status_code=status.HTTP_201_CREATED,
    summary="สร้างเอกสาร RoPa ใหม่ (Data Owner)",
)
def create_document(
    payload: DocumentCreateOwner,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    หน้า: Modal "สร้างเอกสาร" → กดปุ่ม "สร้าง"

    ขั้นตอน:
    1. สุ่ม DP แบบ round robin จาก users ที่ role=PROCESSOR, company_name=processor_company
       (ดูว่าใครถูก assign ล่าสุด → เอาคนถัดไปเรียงตาม user.id)
    2. สร้าง ropa_documents พร้อม document_number = DFT-YYYY-XX
    3. สร้าง ropa_owner_sections (เปล่า status=DRAFT)
    4. สร้าง processor_assignments → ผูก DP ที่สุ่มได้กับเอกสารนี้
    5. สร้าง ropa_processor_sections (เปล่า status=DRAFT)
    """
    # ดึง DP ทั้งหมดในบริษัทที่เลือก เรียงตาม id
    dp_candidates = (
        db.query(UserModel)
        .filter(
            UserModel.role == "PROCESSOR",
            func.lower(UserModel.company_name) == func.lower(payload.processor_company),
            UserModel.status == "ACTIVE",
        )
        .order_by(UserModel.id)
        .all()
    )
    if not dp_candidates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบผู้ประมวลผลข้อมูลส่วนบุคคลในบริษัทนี้",
        )

    now = datetime.now(timezone.utc)
    year = now.year

    # Robust Date Parsing
    parsed_due_date = None
    if payload.due_date:
        try:
            d_str = str(payload.due_date)  # Ensure it's treated as a string
            if "T" not in d_str and len(d_str) == 10:
                parsed_due_date = datetime.fromisoformat(d_str)
            else:
                parsed_due_date = datetime.fromisoformat(d_str.replace("Z", "+00:00"))
            
            if parsed_due_date.tzinfo is None:
                parsed_due_date = parsed_due_date.replace(tzinfo=timezone.utc)
        except Exception as e:
            logger.warning(f"Failed to parse due_date '{payload.due_date}': {e}")
            parsed_due_date = None

    # Random Assignment Logic: สุ่มเลือก DP จากรายชื่อผู้ที่ active ในบริษัทนั้น
    dp_user = random.choice(dp_candidates)
    logger.info(f"Automatically assigned DP {dp_user.email} (Random) for company {payload.processor_company}")

    # Check for duplicate titles (Informational)
    existing_count = db.query(func.count(RopaDocumentModel.id)).filter(
        RopaDocumentModel.created_by == current_user.id,
        RopaDocumentModel.title == payload.title,
        or_(
            RopaDocumentModel.deletion_status == None,
            RopaDocumentModel.deletion_status != "DELETED"
        )
    ).scalar()
    
    if existing_count > 0:
        logger.info(f"User {current_user.id} is creating a document with a duplicate title: {payload.title}")

    doc_number = _generate_document_number(db, "RP")
    doc = RopaDocumentModel(
        document_number=doc_number,
        title=payload.title,
        description=payload.description,
        created_by=current_user.id,
        review_interval_days=payload.review_interval_days,
        due_date=parsed_due_date,
        processor_company=payload.processor_company,
    )
    db.add(doc)
    db.flush()

    owner_section = RopaOwnerSectionModel(
        document_id=doc.id,
        owner_id=current_user.id,
        status="DRAFT",
    )
    db.add(owner_section)

    assignment = ProcessorAssignmentModel(
        document_id=doc.id,
        processor_id=dp_user.id,
        assigned_by=current_user.id,
        due_date=parsed_due_date,
        status="IN_PROGRESS",
    )
    db.add(assignment)
    db.flush()

    processor_section = RopaProcessorSectionModel(
        document_id=doc.id,
        processor_id=dp_user.id,
        status="DRAFT",
    )
    db.add(processor_section)

    db.commit()
    db.refresh(doc)

    return {
        "document_id": str(doc.id),
        "document_number": doc.document_number,
        "assigned_processor_id": dp_user.id,
        "assigned_processor_name": f"{dp_user.first_name or ''} {dp_user.last_name or ''}".strip(),
        "message": "สร้างเอกสารสำเร็จ",
    }


# =============================================================================
# Snapshots (Drafts) — บันทึกสแนปชอตแยกจากงานหลัก
# =============================================================================

@router.post(
    "/documents/{id}/snapshot",
    response_model=OwnerSnapshotRead,
    summary="บันทึกสแนปชอต (Save as Draft) ของ Owner Section",
)
def create_owner_snapshot(
    id: UUID,
    payload: OwnerSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    บันทึกข้อมูลฟอร์มปัจจุบันเป็นสแนปชอตแยกต่างหาก
    - ไม่กระทบข้อมูลในตารางหลัก
    - เก็บไว้ในตาราง ropa_owner_snapshots เพื่อแสดงในตาราง 'ฉบับร่าง'
    """
    doc = db.query(RopaDocumentModel).filter_by(id=id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    if payload.title:
        doc.title = payload.title

    # ตรวจสอบว่ามี snapshot เดิมสำหรับเอกสารนี้และ user นี้หรือไม่
    snapshot = db.query(RopaOwnerSnapshotModel).filter_by(
        document_id=id, 
        user_id=current_user.id
    ).first()

    if snapshot:
        # ถ้ามีอยู่แล้วให้ทับข้อมูลเดิมและอัปเดตเวลา
        snapshot.data = payload.model_dump(exclude_none=True)
        snapshot.created_at = datetime.now(timezone.utc)
    else:
        # ถ้ายังไม่มีให้สร้างใหม่
        snapshot = RopaOwnerSnapshotModel(
            document_id=id,
            user_id=current_user.id,
            data=payload.model_dump(exclude_none=True),
        )
        db.add(snapshot)

    db.commit()
    db.refresh(snapshot)

    return OwnerSnapshotRead(
        id=snapshot.id,
        document_id=snapshot.document_id,
        document_number=doc.document_number,
        title=doc.title,
        data=snapshot.data,
        created_at=snapshot.created_at,
    )


@router.get(
    "/snapshots",
    response_model=List[OwnerSnapshotTableItem],
    summary="ดึงรายการฉบับร่าง (Snapshots) ทั้งหมดของ Data Owner",
)
def list_owner_snapshots(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    ดึงสแนปชอตทั้งหมดที่ user นี้สร้างไว้ เพื่อแสดงในตาราง 'ฉบับร่าง'
    """
    rows = (
        db.query(RopaOwnerSnapshotModel, RopaDocumentModel.document_number, RopaDocumentModel.title)
        .join(RopaDocumentModel, RopaOwnerSnapshotModel.document_id == RopaDocumentModel.id)
        .filter(RopaOwnerSnapshotModel.user_id == current_user.id)
        .order_by(RopaOwnerSnapshotModel.created_at.desc())
        .all()
    )

    result = []
    for snapshot, doc_num, title in rows:
        result.append(OwnerSnapshotTableItem(
            id=snapshot.id,
            document_id=snapshot.document_id,
            document_number=doc_num,
            title=title,
            created_at=snapshot.created_at
        ))
    return result


@router.get(
    "/snapshots/{snapshot_id}",
    response_model=OwnerSnapshotRead,
    summary="ดึงข้อมูลสแนปชอตที่ระบุ",
)
def get_owner_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    snapshot = db.query(RopaOwnerSnapshotModel).filter_by(id=snapshot_id, user_id=current_user.id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="ไม่พบฉบับร่าง")
    
    doc = db.query(RopaDocumentModel).filter_by(id=snapshot.document_id).first()
    
    return OwnerSnapshotRead(
        id=snapshot.id,
        document_id=snapshot.document_id,
        document_number=doc.document_number if doc else None,
        title=doc.title if doc else None,
        data=snapshot.data,
        created_at=snapshot.created_at,
    )


@router.delete(
    "/snapshots/{snapshot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="ลบฉบับร่าง (Snapshot)",
)
def delete_owner_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    snapshot = db.query(RopaOwnerSnapshotModel).filter_by(id=snapshot_id, user_id=current_user.id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="ไม่พบฉบับร่าง")
    
    db.delete(snapshot)
    db.commit()
    return None



# =============================================================================
# GET /owner/dashboard — Dashboard ของ Data Owner
# =============================================================================

@router.get(
    "/dashboard",
    response_model=OwnerDashboardResponse,
    summary="Dashboard สรุปสถิติ (Data Owner)",
)
def get_owner_dashboard(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    now = datetime.now(timezone.utc)

    base_q = db.query(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid)

    # ── Card 1 ────────────────────────────────────────────────────────────
    total = base_q.count()

    # ── Card 2: ต้องแก้ไข (แยก DO / DP) ──────────────────────────────────
    # DPO ใช้ DpoSectionCommentModel (section_key: DO_SEC_x, DP_SEC_x)
    # + cycle.status = CHANGES_REQUESTED เพื่อบ่งบอกว่า DPO ส่งกลับให้แก้

    # needs_fix_do = DPO มี comment ถึง DO (DO_SEC_x / DO_RISK) และ cycle อยู่ใน CHANGES_REQUESTED
    needs_fix_do = (
        db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id)))
        .join(RopaDocumentModel, RopaDocumentModel.id == DocumentReviewCycleModel.document_id)
        .filter(
            RopaDocumentModel.created_by == uid,
            DocumentReviewCycleModel.status == "CHANGES_REQUESTED",
            DocumentReviewCycleModel.document_id.in_(
                db.query(DpoSectionCommentModel.document_id)
                .filter(
                    or_(
                        DpoSectionCommentModel.section_key.like("DO_SEC_%"),
                        DpoSectionCommentModel.section_key == "DO_RISK",
                    )
                )
            ),
        )
        .scalar() or 0
    )

    # needs_fix_dp = DPO มี comment ถึง DP (DP_SEC_x) และ cycle อยู่ใน CHANGES_REQUESTED
    #              + DO ส่ง feedback โดยตรงถึง DP ผ่าน ReviewFeedbackModel (OPEN)
    dp_fix_from_dpo = set(
        row[0] for row in (
            db.query(DocumentReviewCycleModel.document_id)
            .join(RopaDocumentModel, RopaDocumentModel.id == DocumentReviewCycleModel.document_id)
            .filter(
                RopaDocumentModel.created_by == uid,
                DocumentReviewCycleModel.status == "CHANGES_REQUESTED",
                DocumentReviewCycleModel.document_id.in_(
                    db.query(DpoSectionCommentModel.document_id)
                    .filter(DpoSectionCommentModel.section_key.like("DP_SEC_%"))
                ),
            )
            .all()
        )
    )
    dp_fix_from_do = set(
        row[0] for row in (
            db.query(RopaDocumentModel.id)
            .join(RopaProcessorSectionModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
            .join(ReviewFeedbackModel, ReviewFeedbackModel.target_id == RopaProcessorSectionModel.id)
            .filter(
                RopaDocumentModel.created_by == uid,
                ReviewFeedbackModel.status == "OPEN",
            )
            .all()
        )
    )
    needs_fix_dp = len(dp_fix_from_dpo | dp_fix_from_do)

    # ── Card 3: ความเสี่ยง ────────────────────────────────────────────────
    _risk_base = (
        db.query(RopaRiskAssessmentModel)
        .join(RopaDocumentModel, RopaRiskAssessmentModel.document_id == RopaDocumentModel.id)
        .filter(RopaDocumentModel.created_by == uid)
    )
    risk_low    = _risk_base.filter(RopaRiskAssessmentModel.risk_level == "LOW").count()
    risk_medium = _risk_base.filter(RopaRiskAssessmentModel.risk_level == "MEDIUM").count()
    risk_high   = _risk_base.filter(RopaRiskAssessmentModel.risk_level == "HIGH").count()

    # ── Card 4: รอ DPO ตรวจสอบ (แยก จัดเก็บ / ทำลาย) ────────────────────
    # under_review_storage = UNDER_REVIEW ที่ยังไม่มี deletion request
    under_review_storage = base_q.filter(
        RopaDocumentModel.status == "UNDER_REVIEW",
        RopaDocumentModel.deletion_status.is_(None),
    ).count()
    under_review_deletion = base_q.filter(
        RopaDocumentModel.deletion_status == "DELETE_PENDING",
    ).count()

    # ── Card 5: รอดำเนินการ (แยก DO / DP ยังไม่ submit) ──────────────────
    pending_do = (
        db.query(func.count(RopaOwnerSectionModel.id))
        .join(RopaDocumentModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "IN_PROGRESS",
            RopaOwnerSectionModel.status == "DRAFT",
        )
        .scalar() or 0
    )
    pending_dp = (
        db.query(func.count(RopaProcessorSectionModel.id))
        .join(RopaDocumentModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "IN_PROGRESS",
            RopaProcessorSectionModel.status == "DRAFT",
        )
        .scalar() or 0
    )

    # ── Card 6: อนุมัติแล้ว ───────────────────────────────────────────────
    completed = base_q.filter(RopaDocumentModel.status == "COMPLETED").count()

    # ── Card 7: ข้อมูลอ่อนไหว (เอกสารที่มี data_type อย่างน้อย 1 รายการที่ติ้ก is_sensitive=True) ──
    sensitive = (
        db.query(func.count(func.distinct(RopaOwnerSectionModel.document_id)))
        .join(OwnerDataTypeModel, OwnerDataTypeModel.owner_section_id == RopaOwnerSectionModel.id)
        .join(RopaDocumentModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            OwnerDataTypeModel.type == "sensitive",
        )
        .scalar() or 0
    )

    # ── Card 8: DP ส่งช้า = IN_PROGRESS ที่เลย due_date แล้วแต่ DP ยังไม่ submit ──
    # due_date คือวันกำหนดส่งที่ DO ตั้งตอนสร้างเอกสาร
    overdue_dp = (
        db.query(func.count(ProcessorAssignmentModel.id))
        .join(RopaDocumentModel, ProcessorAssignmentModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "IN_PROGRESS",
            ProcessorAssignmentModel.due_date != None,
            ProcessorAssignmentModel.due_date <= now,
            ProcessorAssignmentModel.status != "SUBMITTED",
        )
        .scalar() or 0
    )

    # ── Card 10: ครบกำหนดทำลาย = COMPLETED ที่ retention หมดแล้ว ────────────
    # อิงจากระยะเวลาเก็บรักษาที่กรอกในฟอร์ม:
    #   - DO Section 5: retention_value + retention_unit (ropa_owner_sections)
    #   - DP Section 4: retention_value + retention_unit (ropa_processor_sections)
    # ถ้าฝั่งใดฝั่งหนึ่งครบกำหนดแล้ว = นับว่าถึงเวลาทำลาย
    completed_docs = base_q.filter(
        RopaDocumentModel.status == "COMPLETED",
        RopaDocumentModel.last_approved_at != None,
        or_(
            RopaDocumentModel.deletion_status == None,
            RopaDocumentModel.deletion_status != "DELETED",
        ),
    ).all()

    def _calc_dest_date(approved_at, retention_value, retention_unit):
        """คำนวณวันครบกำหนดทำลายจาก retention period"""
        if not retention_value or not retention_unit:
            return None
        ru = retention_unit.upper()
        if ru == "DAYS":
            return approved_at + timedelta(days=retention_value)
        elif ru == "MONTHS":
            return approved_at + timedelta(days=retention_value * 30)
        elif ru == "YEARS":
            return approved_at + timedelta(days=retention_value * 365)
        return None

    destruction_due = 0
    for doc in completed_docs:
        owner_sec = (
            db.query(RopaOwnerSectionModel)
            .filter(RopaOwnerSectionModel.document_id == doc.id)
            .first()
        )
        proc_sec = (
            db.query(RopaProcessorSectionModel)
            .filter(RopaProcessorSectionModel.document_id == doc.id)
            .first()
        )

        dest_dates = []
        if owner_sec:
            d = _calc_dest_date(doc.last_approved_at, owner_sec.retention_value, owner_sec.retention_unit)
            if d:
                dest_dates.append(d)
        if proc_sec:
            d = _calc_dest_date(doc.last_approved_at, proc_sec.retention_value, proc_sec.retention_unit)
            if d:
                dest_dates.append(d)

        # ถ้าฝั่งใดฝั่งหนึ่งครบกำหนดแล้ว = ถึงเวลาทำลาย
        if dest_dates and min(dest_dates) <= now:
            destruction_due += 1

    # ── Card 9: เช็ครายปี (แยก ตรวจแล้ว / ยังไม่ตรวจ) ───────────────────
    annual_not_reviewed = base_q.filter(
        RopaDocumentModel.status == "COMPLETED",
        RopaDocumentModel.next_review_due_at <= now,
    ).count()
    # ตรวจแล้ว = COMPLETED ที่มี review cycle อนุมัติมากกว่า 1 รอบ (รอบแรก = initial, รอบถัดไป = annual)
    annual_reviewed = (
        db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id)))
        .join(RopaDocumentModel, DocumentReviewCycleModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "COMPLETED",
            DocumentReviewCycleModel.status == "APPROVED",
            DocumentReviewCycleModel.cycle_number > 1,
        )
        .scalar() or 0
    )

    # ── Card 11: ถูกทำลายแล้ว ─────────────────────────────────────────────
    deleted = base_q.filter(RopaDocumentModel.deletion_status == "DELETED").count()

    return OwnerDashboardResponse(
        total_documents=total,
        needs_fix_do_count=needs_fix_do,
        needs_fix_dp_count=needs_fix_dp,
        risk_low_count=risk_low,
        risk_medium_count=risk_medium,
        risk_high_count=risk_high,
        under_review_storage_count=under_review_storage,
        under_review_deletion_count=under_review_deletion,
        pending_do_count=pending_do,
        pending_dp_count=pending_dp,
        completed_count=completed,
        sensitive_document_count=sensitive,
        overdue_dp_count=overdue_dp,
        annual_reviewed_count=annual_reviewed,
        annual_not_reviewed_count=annual_not_reviewed,
        destruction_due_count=destruction_due,
        deleted_count=deleted,
    )


# =============================================================================
# GET /owner/tables/active — ตาราง 1: เอกสาร Active
# =============================================================================

@router.get(
    "/tables/active",
    response_model=List[ActiveTableItem],
    summary="ตาราง 1: เอกสาร Active (IN_PROGRESS)",
)
def get_active_table(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id

    docs = (
        db.query(RopaDocumentModel)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "IN_PROGRESS",
            or_(
                RopaDocumentModel.deletion_status == None,
                RopaDocumentModel.deletion_status != "DELETED",
            ),
        )
        .order_by(RopaDocumentModel.updated_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        owner_section = (
            db.query(RopaOwnerSectionModel)
            .filter(RopaOwnerSectionModel.document_id == doc.id)
            .first()
        )

        # โหลด processor assignment (ต้องการ processor_id สำหรับ dp_name)
        proc_assignment = (
            db.query(ProcessorAssignmentModel)
            .filter(ProcessorAssignmentModel.document_id == doc.id)
            .first()
        )

        processor_section = (
            db.query(RopaProcessorSectionModel)
            .filter(RopaProcessorSectionModel.document_id == doc.id)
            .first()
        )

        # ชื่อ DP
        dp_user = None
        if proc_assignment:
            dp_user = db.query(UserModel).filter(UserModel.id == proc_assignment.processor_id).first()

        owner_review_assignment = (
            db.query(ReviewAssignmentModel)
            .join(DocumentReviewCycleModel)
            .filter(
                DocumentReviewCycleModel.document_id == doc.id,
                ReviewAssignmentModel.user_id == uid,
                ReviewAssignmentModel.role == "OWNER",
            )
            .order_by(DocumentReviewCycleModel.requested_at.desc())
            .first()
        )

        processor_review_assignment = (
            db.query(ReviewAssignmentModel)
            .join(DocumentReviewCycleModel)
            .filter(
                DocumentReviewCycleModel.document_id == doc.id,
                ReviewAssignmentModel.role == "PROCESSOR",
            )
            .order_by(DocumentReviewCycleModel.requested_at.desc())
            .first()
        )

        result.append(ActiveTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            dp_name=_user_full_name(dp_user),
            dp_company=doc.processor_company,
            owner_status=_owner_status_badge(doc, owner_section, owner_review_assignment),
            processor_status=_processor_status_badge(processor_section, processor_review_assignment),
            due_date=doc.due_date,
            created_at=doc.created_at,
            owner_section_id=owner_section.id if owner_section else None,
            owner_section_status=owner_section.status if owner_section else None,
            processor_section_id=processor_section.id if processor_section else None,
            processor_section_status=processor_section.status if processor_section else None,
        ))

    return result


# =============================================================================
# Helper: คำนวณ ui_status สำหรับ ตาราง 2
# =============================================================================

def _table2_ui_status(
    doc: RopaDocumentModel,
    cycle: Optional[DocumentReviewCycleModel],
    uid: int,
    db: Session,
):
    """
    5 สถานะของ ตาราง 2 (DO ↔ DPO):
      WAITING_REVIEW  = รอตรวจสอบ  (cycle.status=IN_REVIEW ไม่มี feedback OPEN)
      WAITING_DO_FIX  = รอ DO แก้ไข (มี feedback OPEN ถึง DO)
      WAITING_DP_FIX  = รอ DP แก้ไข (มี feedback OPEN ถึง DP)
      DO_DONE         = DO ดำเนินการเสร็จสิ้น (ReviewAssignment role=OWNER, status=FIX_SUBMITTED)
      DP_DONE         = DP ดำเนินการเสร็จสิ้น (ReviewAssignment role=PROCESSOR, status=FIX_SUBMITTED)
    """
    if not cycle:
        return "WAITING_REVIEW", "รอตรวจสอบ"

    # DPO ใช้ DpoSectionCommentModel + cycle.status = CHANGES_REQUESTED
    # section_key: DO_SEC_x, DO_RISK = feedback ถึง DO
    #              DP_SEC_x           = feedback ถึง DP
    if cycle.status == "CHANGES_REQUESTED":
        has_do_comment = (
            db.query(DpoSectionCommentModel)
            .filter(
                DpoSectionCommentModel.document_id == doc.id,
                or_(
                    DpoSectionCommentModel.section_key.like("DO_SEC_%"),
                    DpoSectionCommentModel.section_key == "DO_RISK",
                ),
            )
            .first()
        )
        if has_do_comment:
            return "WAITING_DO_FIX", "รอ DO แก้ไข"

        has_dp_comment = (
            db.query(DpoSectionCommentModel)
            .filter(
                DpoSectionCommentModel.document_id == doc.id,
                DpoSectionCommentModel.section_key.like("DP_SEC_%"),
            )
            .first()
        )
        if has_dp_comment:
            return "WAITING_DP_FIX", "รอ DP แก้ไข"

    # ReviewAssignment ของ DO ในรอบนี้
    owner_review_assignment = (
        db.query(ReviewAssignmentModel)
        .filter(
            ReviewAssignmentModel.review_cycle_id == cycle.id,
            ReviewAssignmentModel.user_id == uid,
            ReviewAssignmentModel.role == "OWNER",
        )
        .first()
    )
    if owner_review_assignment and owner_review_assignment.status == "FIX_SUBMITTED":
        return "DO_DONE", "DO ดำเนินการเสร็จสิ้น"

    # ReviewAssignment ของ DP ในรอบนี้
    proc_review_assignment = (
        db.query(ReviewAssignmentModel)
        .filter(
            ReviewAssignmentModel.review_cycle_id == cycle.id,
            ReviewAssignmentModel.role == "PROCESSOR",
        )
        .first()
    )
    if proc_review_assignment and proc_review_assignment.status == "FIX_SUBMITTED":
        return "DP_DONE", "DP ดำเนินการเสร็จสิ้น"

    return "WAITING_REVIEW", "รอตรวจสอบ"


# =============================================================================
# GET /owner/tables/sent-to-dpo — ตาราง 2: ส่ง DPO แล้ว
# =============================================================================

@router.get(
    "/tables/sent-to-dpo",
    response_model=List[SentToDpoTableItem],
    summary="ตาราง 2: เอกสารที่ส่ง DPO แล้ว (UNDER_REVIEW)",
)
def get_sent_to_dpo_table(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id

    docs = (
        db.query(RopaDocumentModel)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "UNDER_REVIEW",
        )
        .order_by(RopaDocumentModel.updated_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        cycle = (
            db.query(DocumentReviewCycleModel)
            .filter(DocumentReviewCycleModel.document_id == doc.id)
            .order_by(DocumentReviewCycleModel.requested_at.desc())
            .first()
        )

        dpo_user = None
        if cycle:
            dpo_assignment = (
                db.query(ReviewDpoAssignmentModel)
                .filter(ReviewDpoAssignmentModel.review_cycle_id == cycle.id)
                .first()
            )
            if dpo_assignment:
                dpo_user = db.query(UserModel).filter(UserModel.id == dpo_assignment.dpo_id).first()
            elif cycle.reviewed_by:
                dpo_user = db.query(UserModel).filter(UserModel.id == cycle.reviewed_by).first()

        # คำนวณ ui_status 5 ค่า
        ui_status, ui_status_label = _table2_ui_status(doc, cycle, uid, db)

        result.append(SentToDpoTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            dpo_name=_user_full_name(dpo_user),
            ui_status=ui_status,
            ui_status_label=ui_status_label,
            sent_at=cycle.requested_at if cycle else None,
            reviewed_at=cycle.reviewed_at if cycle else None,
            due_date=doc.due_date,
        ))

    return result


# =============================================================================
# GET /owner/tables/approved — ตาราง 3: DPO อนุมัติแล้ว
# =============================================================================

@router.get(
    "/tables/approved",
    response_model=List[ApprovedTableItem],
    summary="ตาราง 3: เอกสารที่ DPO อนุมัติแล้ว (COMPLETED)",
)
def get_approved_table(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    now = datetime.now(timezone.utc)

    docs = (
        db.query(RopaDocumentModel)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "COMPLETED",
            or_(
                RopaDocumentModel.deletion_status == None,
                RopaDocumentModel.deletion_status != "DELETED",
            ),
        )
        .order_by(RopaDocumentModel.last_approved_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        # หา DO name (creator)
        do_user = db.query(UserModel).filter(UserModel.id == doc.created_by).first()

        # หา DPO จาก review cycle ล่าสุดที่ APPROVED
        dpo_user = None
        last_cycle = (
            db.query(DocumentReviewCycleModel)
            .filter(
                DocumentReviewCycleModel.document_id == doc.id,
                DocumentReviewCycleModel.status == "APPROVED",
            )
            .order_by(DocumentReviewCycleModel.reviewed_at.desc())
            .first()
        )
        if last_cycle and last_cycle.reviewed_by:
            dpo_user = db.query(UserModel).filter(UserModel.id == last_cycle.reviewed_by).first()

        # คำนวณ destruction_date จาก owner section's retention
        destruction_date = None
        owner_section = (
            db.query(RopaOwnerSectionModel)
            .filter(RopaOwnerSectionModel.document_id == doc.id)
            .first()
        )
        if owner_section and owner_section.retention_value and owner_section.retention_unit and doc.last_approved_at:
            rv = owner_section.retention_value
            ru = (owner_section.retention_unit or "").upper()
            if ru == "DAYS":
                destruction_date = doc.last_approved_at + timedelta(days=rv)
            elif ru == "MONTHS":
                destruction_date = doc.last_approved_at + timedelta(days=rv * 30)
            elif ru == "YEARS":
                destruction_date = doc.last_approved_at + timedelta(days=rv * 365)

        # ถ้าถึงวันทำลายแล้ว → รอทำลาย ไม่ต้องตรวจรายปีอีก
        # ถ้าครบปีแล้ว (next_review_due_at <= now) → ยังไม่ได้ตรวจสอบรายปี
        # ถ้ายังไม่ครบปี → ตรวจสอบเสร็จสิ้น
        if destruction_date and destruction_date <= now:
            annual_review_status = "PENDING_DESTRUCTION"
            annual_review_status_label = "รอทำลายเอกสาร"
        elif doc.next_review_due_at and doc.next_review_due_at <= now:
            annual_review_status = "NOT_REVIEWED"
            annual_review_status_label = "ยังไม่ได้ตรวจสอบ"
        else:
            annual_review_status = "REVIEWED"
            annual_review_status_label = "ตรวจสอบเสร็จสิ้น"

        result.append(ApprovedTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            do_name=_user_full_name(do_user),
            dpo_name=_user_full_name(dpo_user),
            last_approved_at=doc.last_approved_at,
            next_review_due_at=doc.next_review_due_at,
            destruction_date=destruction_date,
            annual_review_status=annual_review_status,
            annual_review_status_label=annual_review_status_label,
        ))

    return result


# =============================================================================
# GET /owner/tables/destroyed — ตาราง 4: เอกสารที่ถูกทำลาย
# =============================================================================

@router.get(
    "/tables/destroyed",
    response_model=List[DestroyedTableItem],
    summary="ตาราง 4: เอกสารที่ถูกทำลายแล้ว (DELETED)",
)
def get_destroyed_table(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id

    docs = (
        db.query(RopaDocumentModel)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.deletion_status == "DELETED",
        )
        .order_by(RopaDocumentModel.deleted_at.desc())
        .all()
    )

    result = []
    for doc in docs:
        do_user = db.query(UserModel).filter(UserModel.id == doc.created_by).first()

        # หา DPO ที่อนุมัติการทำลาย
        deletion_req = (
            db.query(DocumentDeletionRequestModel)
            .filter(
                DocumentDeletionRequestModel.document_id == doc.id,
                DocumentDeletionRequestModel.status == "APPROVED",
            )
            .order_by(DocumentDeletionRequestModel.decided_at.desc())
            .first()
        )
        dpo_user = None
        if deletion_req and deletion_req.dpo_id:
            dpo_user = db.query(UserModel).filter(UserModel.id == deletion_req.dpo_id).first()

        result.append(DestroyedTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            do_name=_user_full_name(do_user),
            dpo_name=_user_full_name(dpo_user),
            deletion_approved_at=deletion_req.decided_at if deletion_req else doc.deleted_at,
            deletion_reason=deletion_req.owner_reason if deletion_req else None,
        ))

    return result


# =============================================================================
# GET /owner/documents/{document_id}/section — ดู Owner Section
# =============================================================================

@router.get(
    "/documents/{document_id}/section",
    response_model=OwnerSectionFullRead,
    summary="ดูหรือกรอก Owner Section (Data Owner)",
)
def get_owner_section(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaOwnerSectionModel)
        .filter(RopaOwnerSectionModel.document_id == document_id)
        .first()
    )
    if not section:
        # กรณี DO ลบฉบับร่างไปแล้ว → สร้าง section เปล่าใหม่เพื่อให้กรอกใหม่ได้
        section = RopaOwnerSectionModel(
            document_id=document_id,
            owner_id=current_user.id,
            status="DRAFT",
        )
        db.add(section)
        db.commit()
        db.refresh(section)

    if section:
        pass

    return _load_owner_section_full(section, db)


# =============================================================================
# PATCH /owner/documents/{document_id}/section — บันทึกฉบับร่าง
# =============================================================================

@router.patch(
    "/documents/{document_id}/section",
    response_model=OwnerSectionFullRead,
    summary="บันทึกฉบับร่าง Owner Section (ไม่เปลี่ยน status)",
)
def save_owner_section_draft(
    document_id: UUID,
    payload: OwnerSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaOwnerSectionModel)
        .filter(RopaOwnerSectionModel.document_id == document_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")

    doc = db.query(RopaDocumentModel).filter_by(id=document_id).first()
    if doc and payload.title:
        doc.title = payload.title

    scalar_fields = [
        "title_prefix", "first_name", "last_name", "address", "email", "phone",
        "contact_email", "company_phone",
        "data_owner_name", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "access_control_policy", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_in_group", "transfer_method", "transfer_protection_standard",
        "transfer_exception", "exemption_usage", "refusal_handling",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    # หากมีการแก้ไข (save draft) ให้เปลี่ยนสถานะกลับเป็น DRAFT เพื่อให้ Processor เห็นว่า "รอ" (ถ้าเคย SUBMIT แล้ว)
    if section.status == RopaSectionEnum.SUBMITTED:
        section.status = RopaSectionEnum.DRAFT

    _replace_owner_sub_tables(section.id, payload, db)

    db.commit()
    db.refresh(section)
    return _load_owner_section_full(section, db)


# =============================================================================
# POST /owner/documents/{document_id}/section/submit — บันทึก (SUBMITTED)
# =============================================================================

@router.post(
    "/documents/{document_id}/section/submit",
    response_model=OwnerSectionFullRead,
    summary="บันทึก Owner Section (เปลี่ยน status เป็น SUBMITTED)",
)
def submit_owner_section(
    document_id: UUID,
    payload: OwnerSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaOwnerSectionModel)
        .filter(RopaOwnerSectionModel.document_id == document_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")

    doc = db.query(RopaDocumentModel).filter_by(id=document_id).first()
    if doc and payload.title:
        doc.title = payload.title

    scalar_fields = [
        "title_prefix", "first_name", "last_name", "address", "email", "phone",
        "contact_email", "company_phone",
        "data_owner_name", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "access_control_policy", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_in_group", "transfer_method", "transfer_protection_standard",
        "transfer_exception", "exemption_usage", "refusal_handling",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_owner_sub_tables(section.id, payload, db)
    section.status = "SUBMITTED"

    db.commit()
    db.refresh(section)
    return _load_owner_section_full(section, db)


# =============================================================================
# POST /owner/documents/{document_id}/send-to-dpo — ส่งให้ DPO review (ตาราง 1)
# =============================================================================

@router.post(
    "/documents/{document_id}/send-to-dpo",
    response_model=SendToDpoResponse,
    summary="ส่งเอกสารให้ DPO review (ตาราง 1)",
)
def send_to_dpo(
    document_id: UUID,
    payload: SendToDpoPayload,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    เงื่อนไข:
    - Owner Section ต้องมี status = SUBMITTED
    - Processor Section ต้องมี status = SUBMITTED
    - Risk Assessment ต้องถูกยืนยันแล้ว (likelihood + impact บันทึกแล้ว)
    - เอกสารต้องอยู่ใน status = IN_PROGRESS
    """
    check_document_access(document_id, current_user, db)

    if payload.dpo_id:
        dpo_user = db.query(UserModel).filter(UserModel.id == payload.dpo_id).first()
        if not dpo_user or dpo_user.role != "DPO":
            raise HTTPException(status_code=400, detail="dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO")
    else:
        # สุ่มเลือก DPO (Random Assignment)
        dpo_candidates = db.query(UserModel).filter(
            UserModel.role == "DPO",
            UserModel.status == "ACTIVE"
        ).all()
        if not dpo_candidates:
            raise HTTPException(status_code=400, detail="ไม่พบ DPO ที่พร้อมใช้งานในระบบ")
        dpo_user = random.choice(dpo_candidates)
        logger.info(f"Automatically assigned DPO {dpo_user.email} (Random) for initial submission of doc {document_id}")


    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    if doc.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="เอกสารต้องอยู่ในสถานะ IN_PROGRESS")

    owner_section = (
        db.query(RopaOwnerSectionModel)
        .filter(RopaOwnerSectionModel.document_id == document_id)
        .first()
    )
    if not owner_section or owner_section.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="Owner Section ยังไม่ได้บันทึกให้สมบูรณ์")

    processor_section = (
        db.query(RopaProcessorSectionModel)
        .filter(RopaProcessorSectionModel.document_id == document_id)
        .first()
    )
    if not processor_section or processor_section.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="Processor Section ยังไม่ได้บันทึกให้สมบูรณ์")

    risk = (
        db.query(RopaRiskAssessmentModel)
        .filter(
            RopaRiskAssessmentModel.document_id == document_id,
            RopaRiskAssessmentModel.likelihood != None,
            RopaRiskAssessmentModel.impact != None,
        )
        .first()
    )
    if not risk:
        raise HTTPException(status_code=400, detail="ยังไม่ได้ยืนยันการประเมินความเสี่ยง")

    # เอกสารทั้งหมดใช้ RP- อยู่แล้ว ไม่ต้องเปลี่ยน prefix

    doc.status = "UNDER_REVIEW"

    existing_cycles = (
        db.query(func.count(DocumentReviewCycleModel.id))
        .filter(DocumentReviewCycleModel.document_id == document_id)
        .scalar() or 0
    )

    cycle = DocumentReviewCycleModel(
        document_id=document_id,
        cycle_number=existing_cycles + 1,
        requested_by=current_user.id,
        status="IN_REVIEW",
    )
    db.add(cycle)
    db.flush()

    db.add(ReviewAssignmentModel(
        review_cycle_id=cycle.id,
        user_id=current_user.id,
        role="OWNER",
        status="FIX_IN_PROGRESS",
    ))

    proc_assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.document_id == document_id)
        .first()
    )
    if proc_assignment:
        db.add(ReviewAssignmentModel(
            review_cycle_id=cycle.id,
            user_id=proc_assignment.processor_id,
            role="PROCESSOR",
            status="FIX_IN_PROGRESS",
        ))

    db.add(ReviewDpoAssignmentModel(
        review_cycle_id=cycle.id,
        dpo_id=payload.dpo_id,
        assignment_method="MANUAL",
    ))

    db.commit()

    return {
        "message": "ส่งให้ DPO สำเร็จ",
        "document_number": doc.document_number,
        "review_cycle_id": str(cycle.id),
    }


# =============================================================================
# POST /owner/documents/{document_id}/send-back-to-dpo — ส่งการแก้ไขคืน DPO (ตาราง 2)
# =============================================================================

@router.post(
    "/documents/{document_id}/send-back-to-dpo",
    response_model=MessageResponse,
    summary="DO ส่งการแก้ไขคืนให้ DPO (ตาราง 2)",
)
def send_back_to_dpo(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    หลังจาก DPO ส่ง CHANGES_REQUESTED มาและ DO แก้ไขแล้ว
    กดปุ่มส่งในตาราง 2 เพื่อแจ้ง DPO ว่าแก้ไขเสร็จแล้ว
    → เปลี่ยน review_assignment.status = FIX_SUBMITTED
    """
    check_document_access(document_id, current_user, db)

    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    if not doc or doc.status != "UNDER_REVIEW":
        raise HTTPException(status_code=400, detail="เอกสารต้องอยู่ในสถานะ UNDER_REVIEW")

    cycle = (
        db.query(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id == document_id,
            DocumentReviewCycleModel.status.in_(["IN_REVIEW", "CHANGES_REQUESTED"]),
        )
        .order_by(DocumentReviewCycleModel.requested_at.desc())
        .first()
    )
    if not cycle:
        raise HTTPException(status_code=400, detail="ไม่มี review cycle ที่ active อยู่")

    assignment = (
        db.query(ReviewAssignmentModel)
        .filter(
            ReviewAssignmentModel.review_cycle_id == cycle.id,
            ReviewAssignmentModel.user_id == current_user.id,
            ReviewAssignmentModel.role == "OWNER",
            ReviewAssignmentModel.status == "FIX_IN_PROGRESS",
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=400, detail="ไม่พบ review assignment ที่ต้องแก้ไข หรือแก้ไขไปแล้ว")

    assignment.status = "FIX_SUBMITTED"

    # Reset cycle กลับเป็น IN_REVIEW เพื่อให้ DPO ตรวจรอบใหม่ได้
    # ถ้าไม่ reset → save_document_comments ใน dashboard.py จะหา cycle IN_REVIEW ไม่เจอ
    # → DPO กด "ยืนยัน" ครั้งถัดไปไม่มีผล (cycle ไม่ถูก APPROVED)
    cycle.status = "IN_REVIEW"

    # ลบ DPO comments เก่าออก เพื่อให้ DPO ตรวจรอบใหม่ได้สะอาด
    # ถ้าไม่ลบ → ตอน DPO กด "ยืนยัน" ครั้งถัดไปโดยไม่เขียน comment
    # has_any_comment จะเจอ comment เก่า → CHANGES_REQUESTED วนไม่จบ
    db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == document_id
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "ส่งการแก้ไขคืนให้ DPO สำเร็จ"}


# =============================================================================
# POST /owner/documents/{document_id}/annual-review — ส่งตรวจสอบรายปี (ตาราง 3)
# =============================================================================

@router.post(
    "/documents/{document_id}/annual-review",
    response_model=AnnualReviewResponse,
    summary="DO ส่งเอกสารตรวจสอบรายปี (ตาราง 3)",
)
def request_annual_review(
    document_id: UUID,
    payload: SendToDpoPayload,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    หน้า: ตาราง 3 เอกสาร COMPLETED ที่ถึงกำหนดทบทวนประจำปี
    กดปุ่มส่งเพื่อส่งเข้า review cycle ใหม่
    → เปลี่ยน doc.status = UNDER_REVIEW และสร้าง DocumentReviewCycleModel ใหม่
    """
    check_document_access(document_id, current_user, db)

    if payload.dpo_id:
        dpo_user = db.query(UserModel).filter(UserModel.id == payload.dpo_id).first()
        if not dpo_user or dpo_user.role != "DPO":
            raise HTTPException(status_code=400, detail="dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO")
    else:
        # สุ่มเลือก DPO (Random Assignment)
        dpo_candidates = db.query(UserModel).filter(
            UserModel.role == "DPO",
            UserModel.status == "ACTIVE"
        ).all()
        if not dpo_candidates:
            raise HTTPException(status_code=400, detail="ไม่พบ DPO ที่พร้อมใช้งานในระบบ")
        dpo_user = random.choice(dpo_candidates)
        logger.info(f"Automatically assigned DPO {dpo_user.email} (Random) for annual review of doc {document_id}")


    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    if not doc or doc.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="เอกสารต้องอยู่ในสถานะ COMPLETED")

    existing_cycles = (
        db.query(func.count(DocumentReviewCycleModel.id))
        .filter(DocumentReviewCycleModel.document_id == document_id)
        .scalar() or 0
    )

    cycle = DocumentReviewCycleModel(
        document_id=document_id,
        cycle_number=existing_cycles + 1,
        requested_by=current_user.id,
        status="IN_REVIEW",
    )
    db.add(cycle)
    db.flush()

    db.add(ReviewAssignmentModel(
        review_cycle_id=cycle.id,
        user_id=current_user.id,
        role="OWNER",
        status="FIX_IN_PROGRESS",
    ))

    # เพิ่ม ReviewAssignment สำหรับ PROCESSOR ด้วย (เหมือน send-to-dpo)
    proc_assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.document_id == document_id)
        .first()
    )
    if proc_assignment:
        db.add(ReviewAssignmentModel(
            review_cycle_id=cycle.id,
            user_id=proc_assignment.processor_id,
            role="PROCESSOR",
            status="FIX_IN_PROGRESS",
        ))

    db.add(ReviewDpoAssignmentModel(
        review_cycle_id=cycle.id,
        dpo_id=payload.dpo_id,
        assignment_method="MANUAL",
    ))

    doc.status = "UNDER_REVIEW"

    # ลบ DPO comments เก่าออก เพื่อให้ DPO ตรวจรอบใหม่ได้สะอาด
    db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == document_id
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "ส่งเอกสารตรวจสอบรายปีสำเร็จ",
        "review_cycle_id": str(cycle.id),
    }


# =============================================================================
# GET /owner/documents/{document_id}/processor-section — ดู Processor Section (Tab 2)
# =============================================================================

@router.get(
    "/documents/{document_id}/processor-section",
    response_model=ProcessorSectionFullRead,
    summary="ดู Processor Section (Data Owner — read-only)",
)
def get_processor_section_for_owner(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    Tab 2 – DO ดู Processor Section ของ DP (read-only)
    - แสดง do_suggestion ที่ DO เขียนไว้
    - ไม่สามารถแก้ไขเนื้อหา DP ได้
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .options(
            joinedload(RopaProcessorSectionModel.personal_data_items),
            joinedload(RopaProcessorSectionModel.data_categories),
            joinedload(RopaProcessorSectionModel.data_types),
            joinedload(RopaProcessorSectionModel.collection_methods),
            joinedload(RopaProcessorSectionModel.data_sources),
            joinedload(RopaProcessorSectionModel.storage_types),
            joinedload(RopaProcessorSectionModel.storage_methods),
        )
        .filter(RopaProcessorSectionModel.document_id == document_id)
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")

    try:
        # Use standardized helper with Role.OWNER to handle is_sent isolation
        return _load_processor_section_full(section, db, Role.OWNER)
    except Exception as e:
        logger.error(f"Error loading processor section for owner: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error loading processor section: {str(e)}")


# =============================================================================
# PATCH /owner/documents/{document_id}/processor-section/suggestion — แก้ไข do_suggestion
# =============================================================================

@router.patch(
    "/documents/{document_id}/processor-section/suggestion",
    response_model=DoSuggestionResponse,
    summary="DO เขียน/แก้ไข คำแนะนำสำหรับ DP (do_suggestion)",
)
def update_do_suggestion(
    document_id: UUID,
    payload: DoSuggestionUpdate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    Tab 2 – กล่องข้อความ "คำแนะนำ/คำสั่งถึง Data Processor"
    DO สามารถแก้ไขได้ตลอดเวลา ไม่จำกัดสถานะเอกสาร
    """
    check_document_access(document_id, current_user, db)

    proc_section = (
        db.query(RopaProcessorSectionModel)
        .filter(RopaProcessorSectionModel.document_id == document_id)
        .first()
    )
    if not proc_section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")

    proc_section.do_suggestion = payload.suggestion
    db.commit()

    return {"message": "บันทึกคำแนะนำสำเร็จ", "do_suggestion": proc_section.do_suggestion}


# =============================================================================
# POST /owner/documents/{document_id}/processor-section/feedback — ส่ง feedback batch ให้ DP
# =============================================================================

@router.post(
    "/documents/{document_id}/processor-section/feedback",
    status_code=status.HTTP_201_CREATED,
    response_model=List[FeedbackRead],
    summary="DO ส่ง feedback batch ให้ DP (ปุ่ม 'ส่งคำร้องขอเปลี่ยนแปลง')",
)
def send_feedback_batch(
    document_id: UUID,
    payload: FeedbackBatch,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    Tab 2 – ปุ่ม "ส่งคำร้องขอเปลี่ยนแปลง" (ล่างขวา)
    ส่ง feedback ทุกรายการที่ DO เขียนไว้ให้ DP พร้อมกันในครั้งเดียว

    - review_cycle_id เป็น nullable → ส่ง feedback ได้แม้ยังไม่มี review cycle
    - section_number ระบุ section ที่ต้องแก้ไข (1-6 สำหรับ DP)
    """
    check_document_access(document_id, current_user, db)

    proc_assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.document_id == document_id)
        .first()
    )
    if not proc_assignment:
        raise HTTPException(status_code=400, detail="ไม่พบ Processor ที่ assign ในเอกสารนี้")

    proc_section = (
        db.query(RopaProcessorSectionModel)
        .filter(RopaProcessorSectionModel.document_id == document_id)
        .first()
    )
    if not proc_section:
        raise HTTPException(status_code=400, detail="ไม่พบ Processor Section")

    if proc_section.status != RopaSectionEnum.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่สามารถส่ง feedback ได้ในขณะนี้ เนื่องจาก Data Processor ยังดำเนินการไม่เสร็จสิ้น (ยังเป็นฉบับร่าง)"
        )

    # หา review cycle ที่ active (optional)
    cycle = (
        db.query(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id == document_id,
            DocumentReviewCycleModel.status == "IN_REVIEW",
        )
        .order_by(DocumentReviewCycleModel.requested_at.desc())
        .first()
    )

    created = []
    for item in payload.items:
        feedback = ReviewFeedbackModel(
            review_cycle_id=cycle.id if cycle else None,
            section_number=item.section_number,
            from_user_id=current_user.id,
            to_user_id=proc_assignment.processor_id,
            target_type="PROCESSOR_SECTION",
            target_id=proc_section.id,
            field_name=item.field_name,
            comment=item.comment,
            status="OPEN",
        )
        db.add(feedback)
        created.append(feedback)

    db.commit()
    for f in created:
        db.refresh(f)

    return created


# =============================================================================
# GET /owner/documents/{document_id}/risk — ดู Risk Assessment (Tab 3)
# =============================================================================

@router.get(
    "/documents/{document_id}/risk",
    response_model=RiskAssessmentRead,
    summary="ดู Risk Assessment ของเอกสาร",
)
def get_risk_assessment(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)

    risk = (
        db.query(RopaRiskAssessmentModel)
        .filter(RopaRiskAssessmentModel.document_id == document_id)
        .first()
    )
    if not risk:
        raise HTTPException(status_code=404, detail="ยังไม่มี Risk Assessment สำหรับเอกสารนี้")

    return risk


# =============================================================================
# POST /owner/documents/{document_id}/risk — ยืนยันการประเมินความเสี่ยง (Tab 3)
# =============================================================================

@router.post(
    "/documents/{document_id}/risk",
    response_model=RiskAssessmentRead,
    summary="สร้างหรืออัปเดต Risk Assessment (ยืนยันการประเมิน)",
)
def upsert_risk_assessment(
    document_id: UUID,
    payload: RiskAssessmentSubmit,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    Tab 3 – ปุ่ม "ยืนยันการประเมิน"
    - บันทึก likelihood × impact → risk_score → risk_level
    - กดแล้วกลับไปหน้าตาราง 1 (frontend จัดการ)
    - ยังไม่ส่ง DPO → ต้องกลับไปกดปุ่มส่งในตาราง 1
    """
    check_document_access(document_id, current_user, db)

    score = payload.likelihood * payload.impact
    if score < 8:
        level = "LOW"
    elif score < 15:
        level = "MEDIUM"
    else:
        level = "HIGH"

    existing = (
        db.query(RopaRiskAssessmentModel)
        .filter(RopaRiskAssessmentModel.document_id == document_id)
        .first()
    )

    if existing:
        existing.likelihood = payload.likelihood
        existing.impact = payload.impact
        existing.risk_score = score
        existing.risk_level = level
        existing.assessed_by = current_user.id
        existing.assessed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        risk = RopaRiskAssessmentModel(
            document_id=document_id,
            assessed_by=current_user.id,
            likelihood=payload.likelihood,
            impact=payload.impact,
            risk_score=score,
            risk_level=level,
        )
        db.add(risk)
        db.commit()
        db.refresh(risk)
        return risk


# =============================================================================
# GET /owner/documents/{document_id}/deletion — ดูสถานะคำร้องขอทำลาย (Tab 4)
# =============================================================================

@router.get(
    "/documents/{document_id}/deletion",
    response_model=DeletionRequestRead,
    summary="ดูสถานะคำร้องขอทำลายเอกสาร",
)
def get_deletion_request(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)

    req = (
        db.query(DocumentDeletionRequestModel)
        .filter(DocumentDeletionRequestModel.document_id == document_id)
        .order_by(DocumentDeletionRequestModel.requested_at.desc())
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="ยังไม่มีคำร้องขอทำลายสำหรับเอกสารนี้")

    return req


# =============================================================================
# POST /owner/documents/{document_id}/deletion — ยื่นคำร้องขอทำลาย
# =============================================================================

@router.post(
    "/documents/{document_id}/deletion",
    status_code=status.HTTP_201_CREATED,
    response_model=DeletionRequestRead,
    summary="ยื่นคำร้องขอทำลายเอกสาร",
)
def create_deletion_request(
    document_id: UUID,
    payload: DeletionRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    เข้าถึงได้จากปุ่มส่ง/ลบ ในตารางใดก็ได้
    สร้าง DocumentDeletionRequestModel และเปลี่ยน doc.deletion_status = DELETE_PENDING
    """
    check_document_access(document_id, current_user, db)

    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    existing_pending = (
        db.query(DocumentDeletionRequestModel)
        .filter(
            DocumentDeletionRequestModel.document_id == document_id,
            DocumentDeletionRequestModel.status == "PENDING",
        )
        .first()
    )
    if existing_pending:
        raise HTTPException(status_code=400, detail="มีคำร้องขอทำลายที่รอการอนุมัติอยู่แล้ว")

    req = DocumentDeletionRequestModel(
        document_id=document_id,
        requested_by=current_user.id,
        owner_reason=payload.owner_reason,
        status="PENDING",
    )
    db.add(req)

    doc.deletion_status = "DELETE_PENDING"

    db.commit()
    db.refresh(req)
    return req


# =============================================================================
# DELETE /owner/documents/{document_id}/section/draft — ลบข้อมูลฉบับร่าง (ตารางฉบับร่าง)
# =============================================================================

@router.delete(
    "/documents/{document_id}/section/draft",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="ลบข้อมูลฉบับร่าง Owner Section (เอกสารยังอยู่ใน ตาราง 1)",
)
def delete_owner_section_draft(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    ลบเฉพาะข้อมูล owner_section ที่กรอกไว้ (พร้อม sub-tables ทั้งหมด)
    เอกสารยังคงอยู่ใน ตาราง 1 สามารถกดรูปตากรอกใหม่ได้ตั้งแต่ต้น
    เงื่อนไข: owner_section.status = DRAFT เท่านั้น
    """
    check_document_access(document_id, current_user, db)

    owner_section = (
        db.query(RopaOwnerSectionModel)
        .filter(RopaOwnerSectionModel.document_id == document_id)
        .first()
    )
    if not owner_section:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลฉบับร่าง")

    if owner_section.status != "DRAFT":
        raise HTTPException(
            status_code=400,
            detail="ลบได้เฉพาะ owner section ที่ยังเป็น DRAFT เท่านั้น"
        )

    db.delete(owner_section)
    db.commit()
