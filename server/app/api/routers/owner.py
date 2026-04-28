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

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload, selectinload

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
    SentToDpoTableItem,
    ApprovedTableItem,
    DestroyedTableItem,
    PaginatedActiveTableResponse,
    PaginatedSentToDpoResponse,
    PaginatedApprovedResponse,
    PaginatedDestroyedResponse,
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
from app.api.routers.processor import (
    _load_processor_section_full,
    _processor_status_badge as _dp_view_badge,
)
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
        exists = (
            db.query(RopaDocumentModel.id)
            .filter(RopaDocumentModel.document_number == doc_number)
            .first()
        )

        if not exists:
            return doc_number


def _user_full_name(user: Optional[UserModel]) -> Optional[str]:
    """
    Format: [Title][FirstName] [LastName]
    Example: นางสาวพรรษชล บุญมาก
    """
    if not user:
        return None
    
    # Combined title and first name (no space)
    title_first = (user.title or "") + (user.first_name or "")
    
    if not title_first and not user.last_name:
        return user.username or None
        
    full_name = title_first
    if user.last_name:
        full_name += f" {user.last_name}"
        
    return full_name.strip() or user.username or None


# =============================================================================
# Helper: Load OwnerSectionFullRead with sub-tables
# =============================================================================


def _load_owner_section_full(
    section: RopaOwnerSectionModel, db: Session
) -> OwnerSectionFullRead:
    """
    โหลด Owner Section พร้อม sub-tables ทั้งหมด
    เพราะ SQLAlchemy ไม่ได้ define relationship ไว้ใน model จึงต้อง query แยก
    """
    sid = section.id
    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == section.document_id).first()
    doc_status = doc.status if doc else None


    personal_data_items = (
        db.query(OwnerPersonalDataItemModel).filter_by(owner_section_id=sid).all()
    )
    data_categories = (
        db.query(OwnerDataCategoryModel).filter_by(owner_section_id=sid).all()
    )
    data_types = db.query(OwnerDataTypeModel).filter_by(owner_section_id=sid).all()
    collection_methods = (
        db.query(OwnerCollectionMethodModel).filter_by(owner_section_id=sid).all()
    )
    data_sources = db.query(OwnerDataSourceModel).filter_by(owner_section_id=sid).all()
    storage_types = (
        db.query(OwnerStorageTypeModel).filter_by(owner_section_id=sid).all()
    )
    storage_methods = (
        db.query(OwnerStorageMethodModel).filter_by(owner_section_id=sid).all()
    )

    # minor_consent_types = list ของ string ตรงกับ 3 checkbox ใน UI
    consent_type_rows = (
        db.query(OwnerMinorConsentTypeModel).filter_by(owner_section_id=sid).all()
    )
    minor_consent_types_out = [ct.type for ct in consent_type_rows]

    # Map sub-tables back to flat booleans/strings for UI
    coll_method = collection_methods[0].method if collection_methods else None
    src_list = [s.source for s in data_sources if s.source]
    ds_direct = "direct" in src_list
    ds_indirect = "indirect" in src_list

    res = OwnerSectionFullRead(
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
        personal_data_items=[
            PersonalDataItemOut.model_validate(x) for x in personal_data_items
        ],
        data_categories=[DataCategoryOut.model_validate(x) for x in data_categories],
        data_types=[DataTypeOut.model_validate(x) for x in data_types],
        collection_methods=[
            CollectionMethodOut.model_validate(x) for x in collection_methods
        ],
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
        collection_method=coll_method,
        data_source_direct=ds_direct,
        data_source_indirect=ds_indirect,
        org_measures=section.org_measures,
        access_control_measures=section.access_control_measures,
        technical_measures=section.technical_measures,
        responsibility_measures=section.responsibility_measures,
        physical_measures=section.physical_measures,
        audit_measures=section.audit_measures,
        document_status=doc_status,
        suggestions=[], 
    )
    
    # Fetch DPO comments for this document that are meant for DO
    dpo_comms = db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == section.document_id,
        or_(
            DpoSectionCommentModel.section_key.in_(["1", "2", "3", "4", "5", "6", "7", "risk", "DO_RISK"]),
            DpoSectionCommentModel.section_key.like("DO_SEC_%")
        )
    ).all()

    for comm in dpo_comms:
        # Map DPO comment to the structure expected by the frontend 'suggestions' array
        s_id = comm.section_key
        if s_id.startswith("DO_SEC_"):
            s_id = s_id.replace("DO_SEC_", "")
        elif s_id == "DO_RISK":
            s_id = "risk"
        
        res.suggestions.append({
            "id": str(comm.id),
            "section": "DO_RISK" if comm.section_key == "risk" or comm.section_key == "DO_RISK" else (comm.section_key if comm.section_key.startswith("DO_SEC_") else f"DO_SEC_{comm.section_key}"),
            "section_id": s_id, 
            "comment": comm.comment,
            "reviewer": "DPO (เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล)",
            "date": comm.created_at.isoformat(),
            "status": "pending",
            "role": "owner"
        })
        
    return res



# =============================================================================
# Helper: Save sub-tables (replace-all pattern)
# =============================================================================


def _replace_owner_sub_tables(section_id: UUID, payload: OwnerSectionSave, db: Session):
    """
    อัปเดต sub-tables โดยลบของเก่าทั้งหมด แล้ว insert ใหม่
    เรียกเฉพาะ field ที่ payload ส่งมา (ไม่ใช่ None)
    """
    if payload.personal_data_items is not None:
        db.query(OwnerPersonalDataItemModel).filter_by(
            owner_section_id=section_id
        ).delete()
        for item in payload.personal_data_items:
            db.add(
                OwnerPersonalDataItemModel(
                    owner_section_id=section_id, **item.model_dump()
                )
            )

    if payload.data_categories is not None:
        db.query(OwnerDataCategoryModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_categories:
            db.add(
                OwnerDataCategoryModel(owner_section_id=section_id, **item.model_dump())
            )

    if payload.data_types is not None:
        db.query(OwnerDataTypeModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_types:
            db.add(OwnerDataTypeModel(owner_section_id=section_id, **item.model_dump()))

    if payload.collection_methods is not None:
        db.query(OwnerCollectionMethodModel).filter_by(
            owner_section_id=section_id
        ).delete()
        for item in payload.collection_methods:
            db.add(
                OwnerCollectionMethodModel(
                    owner_section_id=section_id, **item.model_dump()
                )
            )
    elif payload.collection_method is not None:
        db.query(OwnerCollectionMethodModel).filter_by(
            owner_section_id=section_id
        ).delete()
        if payload.collection_method:
            db.add(
                OwnerCollectionMethodModel(
                    owner_section_id=section_id, method=payload.collection_method
                )
            )

    if payload.data_sources is not None:
        db.query(OwnerDataSourceModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.data_sources:
            db.add(
                OwnerDataSourceModel(owner_section_id=section_id, **item.model_dump())
            )
    elif payload.data_source_direct is not None or payload.data_source_indirect is not None:
        db.query(OwnerDataSourceModel).filter_by(owner_section_id=section_id).delete()
        if payload.data_source_direct:
            db.add(OwnerDataSourceModel(owner_section_id=section_id, source="direct"))
        if payload.data_source_indirect:
            db.add(OwnerDataSourceModel(owner_section_id=section_id, source="indirect"))

    if payload.storage_types is not None:
        db.query(OwnerStorageTypeModel).filter_by(owner_section_id=section_id).delete()
        for item in payload.storage_types:
            db.add(
                OwnerStorageTypeModel(owner_section_id=section_id, **item.model_dump())
            )

    if payload.storage_methods is not None:
        db.query(OwnerStorageMethodModel).filter_by(
            owner_section_id=section_id
        ).delete()
        for item in payload.storage_methods:
            db.add(
                OwnerStorageMethodModel(
                    owner_section_id=section_id, **item.model_dump()
                )
            )

    if payload.minor_consent_types is not None:
        db.query(OwnerMinorConsentTypeModel).filter_by(
            owner_section_id=section_id
        ).delete()
        for t in payload.minor_consent_types:
            db.add(OwnerMinorConsentTypeModel(owner_section_id=section_id, type=t))


# =============================================================================
# Helper: Owner/Processor status badge logic
# =============================================================================


def _owner_status_badge(
    doc: RopaDocumentModel,
    owner_section: Optional[RopaOwnerSectionModel],
    last_cycle_status: Optional[str] = None,
) -> OwnerStatusBadge:
    if last_cycle_status == "CHANGES_REQUESTED":
        # Only show "Waiting for fix" if the status was reset to DRAFT
        if owner_section and getattr(owner_section.status, "value", owner_section.status) == "DRAFT":
            return OwnerStatusBadge(label="รอส่วนของ Data Owner แก้ไข", code="DPO_REJECTED")
        elif owner_section and getattr(owner_section.status, "value", owner_section.status) == "SUBMITTED":
            return OwnerStatusBadge(label="Data Owner ดำเนินการเสร็จสิ้น", code="DO_DONE")

    if owner_section and getattr(owner_section.status, "value", owner_section.status) == "SUBMITTED":
        return OwnerStatusBadge(label="Data Owner ดำเนินการเสร็จสิ้น", code="DO_DONE")
    return OwnerStatusBadge(label="รอส่วนของ Data Owner", code="WAITING_DO")


def _processor_status_badge(
    processor_section: Optional[RopaProcessorSectionModel],
    review_assignment: Optional[ReviewAssignmentModel],
    last_cycle_status: Optional[str] = None,
) -> ProcessorStatusBadge:
    """
    badge สถานะ DP ใน ตาราง 1 (มุมมอง DO) — 2 ค่า:
      DP_DONE    = ส่งให้ DO แล้ว (is_sent=True)
      WAITING_DP = ยังไม่ได้ส่ง หรือ กำลังกรอก (is_sent=False)
    """
    # Check for DPO rejections for the processor
    # We need to check if there are any open DPO comments for the processor section
    # Since this helper doesn't have DB access, we might need a different approach or 
    # accept that DO sees it as WAITING_DP (which is technically correct as status is DRAFT)
    
    # However, to be consistent with _owner_status_badge, we should ideally check cycle status
    if last_cycle_status == "CHANGES_REQUESTED":
        # Check if the processor section is in DRAFT mode (which we set on rejection)
        if processor_section and getattr(processor_section.status, "value", processor_section.status) == "DRAFT":
             return ProcessorStatusBadge(label="รอส่วนของ Data Processor แก้ไข", code="DPO_REJECTED")
        elif processor_section and processor_section.is_sent and getattr(processor_section.status, "value", processor_section.status) == "SUBMITTED":
            return ProcessorStatusBadge(label="Data Processor ดำเนินการเสร็จสิ้น", code="DP_DONE")

    if processor_section and processor_section.is_sent and getattr(processor_section.status, "value", processor_section.status) == "SUBMITTED":
        return ProcessorStatusBadge(
            label="Data Processor ดำเนินการเสร็จสิ้น", code="DP_DONE"
        )

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
        db.query(func.min(UserModel.company_name))
        .filter(
            UserModel.company_name.isnot(None),
            UserModel.status == "ACTIVE",
        )
        .group_by(func.lower(UserModel.company_name))
        .order_by(func.lower(UserModel.company_name))
        .all()
    )
    return {"companies": [r[0] for r in rows if r[0]]}


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
    exists = (
        db.query(UserModel)
        .filter(
            UserModel.role == "PROCESSOR",
            func.lower(UserModel.company_name) == func.lower(company_name),
            UserModel.status == "ACTIVE",
        )
        .first()
        is not None
    )

    return {
        "available": exists,
        "message": None if exists else "ไม่พบผู้ประมวลผลข้อมูลส่วนบุคคลในบริษัทนี้",
    }


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
    logger.info(
        f"Automatically assigned DP {dp_user.email} (Random) for company {payload.processor_company}"
    )

    # Check for duplicate titles (Informational)
    existing_count = (
        db.query(func.count(RopaDocumentModel.id))
        .filter(
            RopaDocumentModel.created_by == current_user.id,
            RopaDocumentModel.title == payload.title,
            or_(
                RopaDocumentModel.deletion_status == None,
                RopaDocumentModel.deletion_status != "DELETED",
            ),
        )
        .scalar()
    )

    if existing_count > 0:
        logger.info(
            f"User {current_user.id} is creating a document with a duplicate title: {payload.title}"
        )

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
    snapshot = (
        db.query(RopaOwnerSnapshotModel)
        .filter_by(document_id=id, user_id=current_user.id)
        .first()
    )

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
        db.query(
            RopaOwnerSnapshotModel,
            RopaDocumentModel.document_number,
            RopaDocumentModel.title,
        )
        .join(
            RopaDocumentModel,
            RopaOwnerSnapshotModel.document_id == RopaDocumentModel.id,
        )
        .filter(RopaOwnerSnapshotModel.user_id == current_user.id)
        .order_by(RopaOwnerSnapshotModel.created_at.desc())
        .all()
    )

    result = []
    for snapshot, doc_num, title in rows:
        result.append(
            OwnerSnapshotTableItem(
                id=snapshot.id,
                document_id=snapshot.document_id,
                document_number=doc_num,
                title=title,
                created_at=snapshot.created_at,
            )
        )
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
    snapshot = (
        db.query(RopaOwnerSnapshotModel)
        .filter_by(id=snapshot_id, user_id=current_user.id)
        .first()
    )
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
    snapshot = (
        db.query(RopaOwnerSnapshotModel)
        .filter_by(id=snapshot_id, user_id=current_user.id)
        .first()
    )
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
        .join(
            RopaDocumentModel,
            RopaDocumentModel.id == DocumentReviewCycleModel.document_id,
        )
        .filter(
            RopaDocumentModel.created_by == uid,
            DocumentReviewCycleModel.status == "CHANGES_REQUESTED",
            DocumentReviewCycleModel.document_id.in_(
                db.query(DpoSectionCommentModel.document_id).filter(
                    or_(
                        DpoSectionCommentModel.section_key.like("DO_SEC_%"),
                        DpoSectionCommentModel.section_key == "DO_RISK",
                    )
                )
            ),
        )
        .scalar()
        or 0
    )

    # ── Ultimate Optimization: Combine all 17 queries into ONE high-performance query ────────
    
    # 1. Total Documents
    total_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid).as_scalar()
    
    # 2. Needs Fix DO
    needs_fix_do_q = (
        db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id)))
        .join(RopaDocumentModel, DocumentReviewCycleModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            DocumentReviewCycleModel.status == "CHANGES_REQUESTED",
            DocumentReviewCycleModel.document_id.in_(
                db.query(DpoSectionCommentModel.document_id).filter(
                    or_(DpoSectionCommentModel.section_key.like("DO_SEC_%"), DpoSectionCommentModel.section_key == "DO_RISK")
                )
            )
        )
        .as_scalar()
    )

    # 3. Needs Fix DP
    needs_fix_dp_q = (
        db.query(func.count(func.distinct(RopaDocumentModel.id)))
        .filter(
            RopaDocumentModel.created_by == uid,
            or_(
                # Path A: From DPO
                RopaDocumentModel.id.in_(
                    db.query(DocumentReviewCycleModel.document_id)
                    .filter(DocumentReviewCycleModel.status == "CHANGES_REQUESTED")
                    .filter(DocumentReviewCycleModel.document_id.in_(
                        db.query(DpoSectionCommentModel.document_id).filter(DpoSectionCommentModel.section_key.like("DP_SEC_%"))
                    ))
                ),
                # Path B: From DO
                RopaDocumentModel.id.in_(
                    db.query(RopaProcessorSectionModel.document_id)
                    .join(ReviewFeedbackModel, ReviewFeedbackModel.target_id == RopaProcessorSectionModel.id)
                    .filter(ReviewFeedbackModel.status == "OPEN")
                )
            )
        )
        .as_scalar()
    )

    # 4. Risks
    risk_low_q = db.query(func.count(RopaRiskAssessmentModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaRiskAssessmentModel.risk_level == "LOW").as_scalar()
    risk_medium_q = db.query(func.count(RopaRiskAssessmentModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaRiskAssessmentModel.risk_level == "MEDIUM").as_scalar()
    risk_high_q = db.query(func.count(RopaRiskAssessmentModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaRiskAssessmentModel.risk_level == "HIGH").as_scalar()

    # 5. Pending DPO
    under_review_storage_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "UNDER_REVIEW", RopaDocumentModel.deletion_status.is_(None)).as_scalar()
    under_review_deletion_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.deletion_status == "DELETE_PENDING").as_scalar()

    # 6. Pending Actions (Drafts)
    pending_do_q = db.query(func.count(RopaOwnerSectionModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "IN_PROGRESS", RopaOwnerSectionModel.status == "DRAFT").as_scalar()
    pending_dp_q = db.query(func.count(RopaProcessorSectionModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "IN_PROGRESS", RopaProcessorSectionModel.status == "DRAFT").as_scalar()

    # 7. Completed
    completed_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "COMPLETED").as_scalar()

    # 8. Sensitive
    sensitive_q = db.query(func.count(func.distinct(RopaOwnerSectionModel.document_id))).join(OwnerDataTypeModel).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, OwnerDataTypeModel.type == "sensitive").as_scalar()

    # 9. Overdue DP
    overdue_dp_q = db.query(func.count(ProcessorAssignmentModel.id)).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "IN_PROGRESS", ProcessorAssignmentModel.due_date != None, ProcessorAssignmentModel.due_date <= now, ProcessorAssignmentModel.status != "SUBMITTED").as_scalar()

    # 10. Destruction Due
    destruction_due_q = (
        db.query(func.count(RopaDocumentModel.id))
        .join(RopaOwnerSectionModel, RopaOwnerSectionModel.document_id == RopaDocumentModel.id)
        .outerjoin(RopaProcessorSectionModel, RopaProcessorSectionModel.document_id == RopaDocumentModel.id)
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "COMPLETED",
            RopaDocumentModel.last_approved_at != None,
            or_(RopaDocumentModel.deletion_status == None, RopaDocumentModel.deletion_status != "DELETED"),
            or_(
                case((RopaOwnerSectionModel.retention_unit == 'YEARS', RopaDocumentModel.last_approved_at + text("interval '1 year' * ropa_owner_sections.retention_value")), (RopaOwnerSectionModel.retention_unit == 'MONTHS', RopaDocumentModel.last_approved_at + text("interval '1 month' * ropa_owner_sections.retention_value")), else_=RopaDocumentModel.last_approved_at + text("interval '1 day' * ropa_owner_sections.retention_value")) <= now,
                case((RopaProcessorSectionModel.retention_unit == 'YEARS', RopaDocumentModel.last_approved_at + text("interval '1 year' * ropa_processor_sections.retention_value")), (RopaProcessorSectionModel.retention_unit == 'MONTHS', RopaDocumentModel.last_approved_at + text("interval '1 month' * ropa_processor_sections.retention_value")), else_=RopaDocumentModel.last_approved_at + text("interval '1 day' * ropa_processor_sections.retention_value")) <= now
            )
        )
        .as_scalar()
    )

    # 11. Annual Review
    annual_not_reviewed_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "COMPLETED", RopaDocumentModel.next_review_due_at <= now).as_scalar()
    annual_reviewed_q = db.query(func.count(func.distinct(DocumentReviewCycleModel.document_id))).join(RopaDocumentModel).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "COMPLETED", DocumentReviewCycleModel.status == "APPROVED", DocumentReviewCycleModel.cycle_number > 1).as_scalar()

    # 12. Destroyed
    deleted_q = db.query(func.count(RopaDocumentModel.id)).filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.deletion_status == "DELETED").as_scalar()

    # ── Execute all as ONE query ───────────────────────────────────────────
    stats = db.query(
        total_q.label('total'),
        needs_fix_do_q.label('fix_do'),
        needs_fix_dp_q.label('fix_dp'),
        risk_low_q.label('r_low'),
        risk_medium_q.label('r_med'),
        risk_high_q.label('r_high'),
        under_review_storage_q.label('ur_store'),
        under_review_deletion_q.label('ur_del'),
        pending_do_q.label('p_do'),
        pending_dp_q.label('p_dp'),
        completed_q.label('comp'),
        sensitive_q.label('sens'),
        overdue_dp_q.label('over_dp'),
        destruction_due_q.label('dest_due'),
        annual_not_reviewed_q.label('ann_not'),
        annual_reviewed_q.label('ann_rev'),
        deleted_q.label('deleted')
    ).first()

    return OwnerDashboardResponse(
        total_documents=stats.total or 0,
        needs_fix_do_count=stats.fix_do or 0,
        needs_fix_dp_count=stats.fix_dp or 0,
        risk_low_count=stats.r_low or 0,
        risk_medium_count=stats.r_med or 0,
        risk_high_count=stats.r_high or 0,
        under_review_storage_count=stats.ur_store or 0,
        under_review_deletion_count=stats.ur_del or 0,
        pending_do_count=stats.p_do or 0,
        pending_dp_count=stats.p_dp or 0,
        completed_count=stats.comp or 0,
        sensitive_document_count=stats.sens or 0,
        overdue_dp_count=stats.over_dp or 0,
        annual_reviewed_count=stats.ann_rev or 0,
        annual_not_reviewed_count=stats.ann_not or 0,
        destruction_due_count=stats.dest_due or 0,
        deleted_count=stats.deleted or 0,
    )


# =============================================================================
# GET /owner/tables/active — ตาราง 1: เอกสาร Active
# =============================================================================


@router.get(
    "/tables/active",
    response_model=PaginatedActiveTableResponse,
    summary="ตาราง 1 – เอกสาร Active (IN_PROGRESS)",
)
def get_active_table(
    page: int = 1,
    page_size: int = 50,
    status_filter: Optional[str] = Query("all"),
    period: Optional[str] = Query("all"),
    custom_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    offset = (page - 1) * page_size

    # 1. Base Query with Projections
    base_q = (
        db.query(RopaDocumentModel)
        .options(
            joinedload(RopaDocumentModel.owner_section).load_only(RopaOwnerSectionModel.id, RopaOwnerSectionModel.status),
            selectinload(RopaDocumentModel.processor_sections).load_only(RopaProcessorSectionModel.id, RopaProcessorSectionModel.status, RopaProcessorSectionModel.is_sent),
            selectinload(RopaDocumentModel.processor_assignments).joinedload(ProcessorAssignmentModel.processor).load_only(UserModel.first_name, UserModel.last_name),
            selectinload(RopaDocumentModel.risk_assessments).load_only(RopaRiskAssessmentModel.likelihood, RopaRiskAssessmentModel.impact)
        )
        .filter(
            RopaDocumentModel.created_by == uid,
            RopaDocumentModel.status == "IN_PROGRESS",
            or_(RopaDocumentModel.deletion_status == None, RopaDocumentModel.deletion_status != "DELETED"),
        )
    )

    # ─── Search Logic ───
    if search:
        search_pattern = f"%{search}%"
        base_q = base_q.filter(
            or_(
                RopaDocumentModel.document_number.ilike(search_pattern),
                RopaDocumentModel.title.ilike(search_pattern)
            )
        )

    # ─── Filtering Logic ───
    if status_filter and status_filter != "all":
        if status_filter == "wait_owner":
            base_q = base_q.join(RopaOwnerSectionModel).filter(RopaOwnerSectionModel.status != "SUBMITTED")
        elif status_filter == "wait_processor":
            base_q = base_q.join(RopaProcessorSectionModel).filter(
                or_(
                    RopaProcessorSectionModel.status != "SUBMITTED",
                    RopaProcessorSectionModel.is_sent == False
                )
            )
        elif status_filter == "done_owner":
            base_q = base_q.join(RopaOwnerSectionModel).filter(RopaOwnerSectionModel.status == "SUBMITTED")
        elif status_filter == "done_processor":
            base_q = base_q.join(RopaProcessorSectionModel).filter(
                RopaProcessorSectionModel.status == "SUBMITTED",
                RopaProcessorSectionModel.is_sent == True
            )
        elif status_filter == "wait_all":
            base_q = base_q.join(RopaOwnerSectionModel).join(RopaProcessorSectionModel).filter(
                RopaOwnerSectionModel.status != "SUBMITTED",
                or_(
                    RopaProcessorSectionModel.status != "SUBMITTED",
                    RopaProcessorSectionModel.is_sent == False
                )
            )
        elif status_filter == "done_all":
            base_q = base_q.join(RopaOwnerSectionModel).join(RopaProcessorSectionModel).filter(
                RopaOwnerSectionModel.status == "SUBMITTED",
                RopaProcessorSectionModel.status == "SUBMITTED",
                RopaProcessorSectionModel.is_sent == True
            )

    if period and period != "all":
        now = datetime.now(timezone.utc)
        if period == "7days":
            base_q = base_q.filter(RopaDocumentModel.due_date <= now + timedelta(days=7))
        elif period == "30days":
            base_q = base_q.filter(RopaDocumentModel.due_date <= now + timedelta(days=30))
        elif period == "overdue":
            base_q = base_q.filter(RopaDocumentModel.due_date < now)
        elif period == "custom" and custom_date:
            try:
                c_date = datetime.fromisoformat(custom_date.replace("Z", "+00:00"))
                # Filter for the entire day of c_date
                start_of_day = c_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = start_of_day + timedelta(days=1)
                base_q = base_q.filter(RopaDocumentModel.due_date >= start_of_day, RopaDocumentModel.due_date < end_of_day)
            except Exception as e:
                logger.warning(f"Failed to parse custom_date '{custom_date}': {e}")

    total = base_q.count()
    docs = base_q.order_by(RopaDocumentModel.created_at.desc()).offset(offset).limit(page_size).all()

    # 2. Bulk fetch cycles and assignments
    doc_ids = [doc.id for doc in docs]
    all_cycles = (
        db.query(DocumentReviewCycleModel)
        .options(joinedload(DocumentReviewCycleModel.reviewer).load_only(UserModel.first_name, UserModel.last_name))
        .filter(DocumentReviewCycleModel.document_id.in_(doc_ids))
        .order_by(DocumentReviewCycleModel.cycle_number.desc())
        .all()
    )
    
    latest_cycles = {}
    for c in all_cycles:
        if c.document_id not in latest_cycles:
            latest_cycles[c.document_id] = c

    cycle_ids = [c.id for c in latest_cycles.values()]
    all_assignments = db.query(ReviewAssignmentModel).filter(ReviewAssignmentModel.review_cycle_id.in_(cycle_ids)).all()
    assignments_map = {(a.review_cycle_id, a.role): a for a in all_assignments}

    # 3. Build Result
    result = []
    for doc in docs:
        owner_section = doc.owner_section
        proc_assignment = doc.processor_assignments[0] if doc.processor_assignments else None
        processor_section = doc.processor_sections[0] if doc.processor_sections else None
        
        is_risk_complete = any(r.likelihood is not None and r.impact is not None for r in doc.risk_assessments)
        dp_user = proc_assignment.processor if proc_assignment else None
        last_cycle = latest_cycles.get(doc.id)
        
        result.append(
            ActiveTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                dp_name=_user_full_name(dp_user),
                dp_company=doc.processor_company,
                owner_status=_owner_status_badge(doc, owner_section, last_cycle.status if last_cycle else None),
                processor_status=_processor_status_badge(processor_section, assignments_map.get((last_cycle.id, "PROCESSOR")) if last_cycle else None, last_cycle.status if last_cycle else None),
                due_date=doc.due_date,
                created_at=doc.created_at,
                owner_section_id=owner_section.id if owner_section else None,
                owner_section_status=owner_section.status if owner_section else None,
                processor_section_id=processor_section.id if processor_section else None,
                processor_section_status=processor_section.status if processor_section else None,
                is_risk_complete=is_risk_complete,
                deletion_status=doc.deletion_status,
            )
        )

    return {"items": result, "total": total, "page": page, "limit": page_size}


# =============================================================================
# Helper: คำนวณ ui_status สำหรับ ตาราง 2
# =============================================================================


def _table2_ui_status_optimized(
    doc: RopaDocumentModel,
    cycle: Optional[DocumentReviewCycleModel],
    uid: int,
    comments: List[DpoSectionCommentModel],
    assignments_map: dict,  # { (cycle_id, role): ReviewAssignmentModel }
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
        has_do_comment = any(
            c.section_key.startswith("DO_SEC_") or c.section_key == "DO_RISK"
            for c in comments
        )
        if has_do_comment:
            return "WAITING_DO_FIX", "รอส่วนของ Data Owner แก้ไข"

        has_dp_comment = any(c.section_key.startswith("DP_SEC_") for c in comments)
        if has_dp_comment:
            return "WAITING_DP_FIX", "รอส่วนของ Data Processor แก้ไข"

    # ReviewAssignment ของ DO ในรอบนี้
    owner_review_assignment = (
        assignments_map.get((cycle.id, "OWNER")) if cycle else None
    )
    if owner_review_assignment and owner_review_assignment.status == "FIX_SUBMITTED":
        return "DO_DONE", "DO ดำเนินการเสร็จสิ้น"

    # ReviewAssignment ของ DP ในรอบนี้
    proc_review_assignment = (
        assignments_map.get((cycle.id, "PROCESSOR")) if cycle else None
    )
    if proc_review_assignment and proc_review_assignment.status == "FIX_SUBMITTED":
        return "DP_DONE", "DP ดำเนินการเสร็จสิ้น"

    return "WAITING_REVIEW", "รอตรวจสอบ"


# =============================================================================
# GET /owner/tables/sent-to-dpo — ตาราง 2: ส่ง DPO แล้ว
# =============================================================================


@router.get(
    "/tables/sent-to-dpo",
    response_model=PaginatedSentToDpoResponse,
    summary="ตาราง 2: เอกสารที่ส่ง DPO แล้ว (UNDER_REVIEW)",
)
def get_sent_to_dpo_table(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    offset = (page - 1) * page_size

    base_q = (
        db.query(RopaDocumentModel)
        .options(
            joinedload(RopaDocumentModel.owner_section).load_only(RopaOwnerSectionModel.id),
            selectinload(RopaDocumentModel.processor_assignments).joinedload(ProcessorAssignmentModel.processor).load_only(UserModel.first_name, UserModel.last_name)
        )
        .filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "UNDER_REVIEW")
    )

    total = base_q.count()
    docs = base_q.order_by(RopaDocumentModel.updated_at.desc()).offset(offset).limit(page_size).all()

    # Bulk fetch cycles, assignments, and comments
    doc_ids = [doc.id for doc in docs]
    all_cycles = (
        db.query(DocumentReviewCycleModel)
        .options(joinedload(DocumentReviewCycleModel.reviewer).load_only(UserModel.first_name, UserModel.last_name))
        .filter(DocumentReviewCycleModel.document_id.in_(doc_ids))
        .order_by(DocumentReviewCycleModel.cycle_number.desc())
        .all()
    )
    
    latest_cycles = {c.document_id: c for c in all_cycles}
    cycle_ids = [c.id for c in latest_cycles.values()]
    
    all_assignments = db.query(ReviewAssignmentModel).filter(ReviewAssignmentModel.review_cycle_id.in_(cycle_ids)).all()
    assignments_map = {(a.review_cycle_id, a.role): a for a in all_assignments}
    
    all_comments = db.query(DpoSectionCommentModel).filter(DpoSectionCommentModel.review_cycle_id.in_(cycle_ids)).all()
    comments_map = {}
    for c in all_comments:
        if c.review_cycle_id not in comments_map: comments_map[c.review_cycle_id] = []
        comments_map[c.review_cycle_id].append(c)

    result = []
    for doc in docs:
        last_cycle = latest_cycles.get(doc.id)
        cycle_comments = comments_map.get(last_cycle.id, []) if last_cycle else []
        ui_status, ui_label = _table2_ui_status_optimized(doc, last_cycle, uid, cycle_comments, assignments_map)
        
        dpo_user = last_cycle.reviewer if last_cycle else None
        proc_assignment = doc.processor_assignments[0] if doc.processor_assignments else None
        dp_user = proc_assignment.processor if proc_assignment else None

        result.append(
            SentToDpoTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                dpo_name=_user_full_name(dpo_user),
                ui_status=ui_status,
                ui_status_label=ui_label,
                sent_at=last_cycle.requested_at if last_cycle else None,
                reviewed_at=last_cycle.reviewed_at if last_cycle else None,
                due_date=doc.due_date,
                deletion_status=doc.deletion_status,
            )
        )

    return {"items": result, "total": total, "page": page, "limit": page_size}


# =============================================================================
# GET /owner/tables/approved — ตาราง 3: DPO อนุมัติแล้ว
# =============================================================================


@router.get(
    "/tables/approved",
    response_model=PaginatedApprovedResponse,
    summary="ตาราง 3: เอกสารที่อนุมัติแล้ว (COMPLETED)",
)
def get_approved_table(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    now = datetime.now(timezone.utc)
    offset = (page - 1) * page_size

    base_q = (
        db.query(RopaDocumentModel)
        .options(
            joinedload(RopaDocumentModel.owner_section).load_only(RopaOwnerSectionModel.id, RopaOwnerSectionModel.retention_value, RopaOwnerSectionModel.retention_unit),
            selectinload(RopaDocumentModel.processor_sections).load_only(RopaProcessorSectionModel.id, RopaProcessorSectionModel.retention_value, RopaProcessorSectionModel.retention_unit),
            selectinload(RopaDocumentModel.processor_assignments).joinedload(ProcessorAssignmentModel.processor).load_only(UserModel.first_name, UserModel.last_name)
        )
        .filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.status == "COMPLETED")
    )

    total = base_q.count()
    docs = base_q.order_by(RopaDocumentModel.last_approved_at.desc()).offset(offset).limit(page_size).all()

    # Bulk fetch cycles for DPO name
    doc_ids = [doc.id for doc in docs]
    approved_cycles = (
        db.query(DocumentReviewCycleModel)
        .options(joinedload(DocumentReviewCycleModel.reviewer).load_only(UserModel.first_name, UserModel.last_name))
        .filter(DocumentReviewCycleModel.document_id.in_(doc_ids), DocumentReviewCycleModel.status == "APPROVED")
        .order_by(DocumentReviewCycleModel.reviewed_at.desc())
        .all()
    )
    cycles_map = {c.document_id: c for c in approved_cycles}

    result = []
    for doc in docs:
        owner_sec = doc.owner_section
        proc_sec = doc.processor_sections[0] if doc.processor_sections else None
        
        destruction_date = None
        target_sec = owner_sec or proc_sec
        if target_sec and target_sec.retention_value and target_sec.retention_unit:
            rv = target_sec.retention_value
            ru = target_sec.retention_unit.upper()
            if ru == "DAYS": destruction_date = doc.last_approved_at + timedelta(days=rv)
            elif ru == "MONTHS": destruction_date = doc.last_approved_at + timedelta(days=rv * 30)
            elif ru == "YEARS": destruction_date = doc.last_approved_at + timedelta(days=rv * 365)
        
        if destruction_date:
            # Ensure destruction_date is aware for comparison
            if destruction_date.tzinfo is None:
                destruction_date = destruction_date.replace(tzinfo=timezone.utc)
            
            if destruction_date <= now:
                status, label = "PENDING_DESTRUCTION", "รอทำลายเอกสาร"
            elif doc.next_review_due_at:
                nrda = doc.next_review_due_at
                if nrda.tzinfo is None: nrda = nrda.replace(tzinfo=timezone.utc)
                if nrda <= now:
                    status, label = "NOT_REVIEWED", "ยังไม่ได้ตรวจสอบ"
                else:
                    status, label = "REVIEWED", "ตรวจสอบเสร็จสิ้น"
            else:
                status, label = "REVIEWED", "ตรวจสอบเสร็จสิ้น"
        else:
            if doc.next_review_due_at:
                nrda = doc.next_review_due_at
                if nrda.tzinfo is None: nrda = nrda.replace(tzinfo=timezone.utc)
                if nrda <= now:
                    status, label = "NOT_REVIEWED", "ยังไม่ได้ตรวจสอบ"
                else:
                    status, label = "REVIEWED", "ตรวจสอบเสร็จสิ้น"
            else:
                status, label = "REVIEWED", "ตรวจสอบเสร็จสิ้น"

        last_cycle = cycles_map.get(doc.id)
        dpo_user = last_cycle.reviewer if last_cycle else None
        proc_assignment = doc.processor_assignments[0] if doc.processor_assignments else None
        dp_user = proc_assignment.processor if proc_assignment else None

        result.append(
            ApprovedTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                do_name=_user_full_name(current_user),
                dpo_name=_user_full_name(dpo_user),
                last_approved_at=doc.last_approved_at,
                next_review_due_at=doc.next_review_due_at,
                destruction_date=destruction_date,
                annual_review_status=status,
                annual_review_status_label=label,
                deletion_status=doc.deletion_status,
            )
        )

    return {"items": result, "total": total, "page": page, "limit": page_size}


# =============================================================================
# GET /owner/tables/destroyed — ตาราง 4: เอกสารที่ถูกทำลาย
# =============================================================================


@router.get(
    "/tables/destroyed",
    response_model=PaginatedDestroyedResponse,
    summary="ตาราง 4: เอกสารที่ถูกทำลายแล้ว (DELETED)",
)
def get_destroyed_table(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    uid = current_user.id
    offset = (page - 1) * page_size

    base_q = (
        db.query(RopaDocumentModel)
        .options(
            selectinload(RopaDocumentModel.processor_assignments).joinedload(ProcessorAssignmentModel.processor).load_only(UserModel.first_name, UserModel.last_name)
        )
        .filter(RopaDocumentModel.created_by == uid, RopaDocumentModel.deletion_status == "DELETED")
    )

    total = base_q.count()
    docs = base_q.order_by(RopaDocumentModel.deleted_at.desc()).offset(offset).limit(page_size).all()

    # Bulk load deletion requests to find who approved destruction
    doc_ids = [doc.id for doc in docs]
    deletion_reqs = (
        db.query(DocumentDeletionRequestModel)
        .options(joinedload(DocumentDeletionRequestModel.reviewer).load_only(UserModel.first_name, UserModel.last_name))
        .filter(DocumentDeletionRequestModel.document_id.in_(doc_ids), DocumentDeletionRequestModel.status == "APPROVED")
        .all()
    )
    reqs_map = {r.document_id: r for r in deletion_reqs}

    result = []
    for doc in docs:
        req = reqs_map.get(doc.id)
        dpo_user = req.reviewer if req else None
        proc_assignment = doc.processor_assignments[0] if doc.processor_assignments else None
        dp_user = proc_assignment.processor if proc_assignment else None

        result.append(
            DestroyedTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                do_name=_user_full_name(current_user),
                dpo_name=_user_full_name(dpo_user),
                deletion_approved_at=doc.deleted_at or doc.updated_at,
                deletion_reason=req.owner_reason if req else None,
            )
        )

    return {"items": result, "total": total, "page": page, "limit": page_size}


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
    current_user: UserRead = Depends(require_roles(Role.OWNER, Role.DPO)),
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
        "title_prefix",
        "first_name",
        "last_name",
        "address",
        "email",
        "phone",
        "contact_email",
        "company_phone",
        "data_owner_name",
        "processing_activity",
        "purpose_of_processing",
        "data_source_other",
        "retention_value",
        "retention_unit",
        "access_control_policy",
        "deletion_method",
        "legal_basis",
        "has_cross_border_transfer",
        "transfer_country",
        "transfer_in_group",
        "transfer_method",
        "transfer_protection_standard",
        "transfer_exception",
        "exemption_usage",
        "refusal_handling",
        "org_measures",
        "access_control_measures",
        "technical_measures",
        "responsibility_measures",
        "physical_measures",
        "audit_measures",
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
        "title_prefix",
        "first_name",
        "last_name",
        "address",
        "email",
        "phone",
        "contact_email",
        "company_phone",
        "data_owner_name",
        "processing_activity",
        "purpose_of_processing",
        "data_source_other",
        "retention_value",
        "retention_unit",
        "access_control_policy",
        "deletion_method",
        "legal_basis",
        "has_cross_border_transfer",
        "transfer_country",
        "transfer_in_group",
        "transfer_method",
        "transfer_protection_standard",
        "transfer_exception",
        "exemption_usage",
        "refusal_handling",
        "org_measures",
        "access_control_measures",
        "technical_measures",
        "responsibility_measures",
        "physical_measures",
        "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_owner_sub_tables(section.id, payload, db)
    section.status = "SUBMITTED"

    # ALSO: Clear DPO comments for DO sections because the user has fixed them
    # Keys for DO: "1", "2", "3", "risk" (and old DO_SEC_ keys)
    db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == document_id,
        or_(
            DpoSectionCommentModel.section_key.in_(["1", "2", "3", "risk"]),
            DpoSectionCommentModel.section_key.like("DO_SEC_%")
        )
    ).delete(synchronize_session=False)

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
            raise HTTPException(
                status_code=400, detail="dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO"
            )
    else:
        # สุ่มเลือก DPO (Random Assignment)
        dpo_candidates = (
            db.query(UserModel)
            .filter(UserModel.role == "DPO", UserModel.status == "ACTIVE")
            .all()
        )
        if not dpo_candidates:
            raise HTTPException(status_code=400, detail="ไม่พบ DPO ที่พร้อมใช้งานในระบบ")
        dpo_user = random.choice(dpo_candidates)
        logger.info(
            f"Automatically assigned DPO {dpo_user.email} (Random) for initial submission of doc {document_id}"
        )

    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")
    if doc.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="เอกสารต้องอยู่ในสถานะ IN_PROGRESS")
    if doc.deletion_status == "DELETE_PENDING":
        raise HTTPException(
            status_code=400,
            detail="เอกสารนี้อยู่ระหว่างรอการอนุมัติทำลาย ไม่สามารถส่งให้ DPO ตรวจสอบได้",
        )

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
        raise HTTPException(
            status_code=400, detail="Processor Section ยังไม่ได้บันทึกให้สมบูรณ์"
        )

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
        .scalar()
        or 0
    )

    cycle = DocumentReviewCycleModel(
        document_id=document_id,
        cycle_number=existing_cycles + 1,
        requested_by=current_user.id,
        status="IN_REVIEW",
    )
    db.add(cycle)
    db.flush()

    db.add(
        ReviewAssignmentModel(
            review_cycle_id=cycle.id,
            user_id=current_user.id,
            role="OWNER",
            status="FIX_IN_PROGRESS",
        )
    )

    proc_assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.document_id == document_id)
        .first()
    )
    if proc_assignment:
        db.add(
            ReviewAssignmentModel(
                review_cycle_id=cycle.id,
                user_id=proc_assignment.processor_id,
                role="PROCESSOR",
                status="FIX_IN_PROGRESS",
            )
        )

    db.add(
        ReviewDpoAssignmentModel(
            review_cycle_id=cycle.id,
            dpo_id=dpo_user.id,
            assignment_method="MANUAL" if payload.dpo_id else "AUTO",
        )
    )

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

    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
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
        raise HTTPException(
            status_code=400, detail="ไม่พบ review assignment ที่ต้องแก้ไข หรือแก้ไขไปแล้ว"
        )

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
            raise HTTPException(
                status_code=400, detail="dpo_id ไม่ถูกต้องหรือ user ที่เลือกไม่ใช่ DPO"
            )
    else:
        # สุ่มเลือก DPO (Random Assignment)
        dpo_candidates = (
            db.query(UserModel)
            .filter(UserModel.role == "DPO", UserModel.status == "ACTIVE")
            .all()
        )
        if not dpo_candidates:
            raise HTTPException(status_code=400, detail="ไม่พบ DPO ที่พร้อมใช้งานในระบบ")
        dpo_user = random.choice(dpo_candidates)
        logger.info(
            f"Automatically assigned DPO {dpo_user.email} (Random) for annual review of doc {document_id}"
        )

    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if not doc or doc.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="เอกสารต้องอยู่ในสถานะ COMPLETED")

    if doc.deletion_status == "DELETE_PENDING":
        raise HTTPException(
            status_code=400, detail="ไม่สามารถส่งทบทวนรายปีได้เนื่องจากเอกสารนี้อยู่ระหว่างรอดำเนินการทำลาย"
        )

    existing_cycles = (
        db.query(func.count(DocumentReviewCycleModel.id))
        .filter(DocumentReviewCycleModel.document_id == document_id)
        .scalar()
        or 0
    )

    cycle = DocumentReviewCycleModel(
        document_id=document_id,
        cycle_number=existing_cycles + 1,
        requested_by=current_user.id,
        status="IN_REVIEW",
    )
    db.add(cycle)
    db.flush()

    db.add(
        ReviewAssignmentModel(
            review_cycle_id=cycle.id,
            user_id=current_user.id,
            role="OWNER",
            status="FIX_IN_PROGRESS",
        )
    )

    # เพิ่ม ReviewAssignment สำหรับ PROCESSOR ด้วย (เหมือน send-to-dpo)
    proc_assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(ProcessorAssignmentModel.document_id == document_id)
        .first()
    )
    if proc_assignment:
        db.add(
            ReviewAssignmentModel(
                review_cycle_id=cycle.id,
                user_id=proc_assignment.processor_id,
                role="PROCESSOR",
                status="FIX_IN_PROGRESS",
            )
        )

    db.add(
        ReviewDpoAssignmentModel(
            review_cycle_id=cycle.id,
            dpo_id=dpo_user.id,
            assignment_method="MANUAL" if payload.dpo_id else "AUTO",
        )
    )

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
    current_user: UserRead = Depends(require_roles(Role.OWNER, Role.DPO)),
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
        # Use actual user role: DPO should see full data, OWNER gets is_sent isolation
        requester_role = Role(current_user.role) if current_user.role in [r.value for r in Role] else Role.OWNER
        return _load_processor_section_full(section, db, requester_role)
    except Exception as e:
        logger.error(
            f"Error loading processor section for owner: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Internal error loading processor section: {str(e)}",
        )


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

    if not proc_section.is_sent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่สามารถส่ง feedback ได้เนื่องจาก Data Processor ยังไม่ได้แชร์ข้อมูลให้ท่านตรวจสอบ",
        )

    # หา review cycle ที่ active (จำเป็นต้องมีเพื่อผูก feedback)
    cycle = (
        db.query(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id == document_id,
            DocumentReviewCycleModel.status == "IN_REVIEW",
        )
        .order_by(DocumentReviewCycleModel.requested_at.desc())
        .first()
    )

    # หากไม่พบ (เช่น กรณีตีกลับตั้งแต่เริ่มต้น) ให้สร้าง cycle ขึ้นมารองรับ feedback
    if not cycle:
        last_cycle_num = (
            db.query(func.max(DocumentReviewCycleModel.cycle_number))
            .filter(DocumentReviewCycleModel.document_id == document_id)
            .scalar()
            or 0
        )

        cycle = DocumentReviewCycleModel(
            document_id=document_id,
            cycle_number=last_cycle_num + 1,
            requested_by=current_user.id,
            status="IN_REVIEW",
            requested_at=datetime.now(timezone.utc),
        )
        db.add(cycle)
        db.flush()  # เพื่อให้ได้ cycle.id มาใช้งานต่อ

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

    # Update processor section status to DRAFT (Send back for correction)
    proc_section.status = RopaSectionEnum.DRAFT
    # Keep is_sent=True so DO can still see the document while DP is fixing it
    proc_section.is_sent = True

    # Update document status to IN_PROGRESS so it shows as needing work
    if proc_section.document.status == "UNDER_REVIEW":
        proc_section.document.status = "IN_PROGRESS"

    db.commit()
    for f in created:
        db.refresh(f)
    db.refresh(proc_section)

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
    current_user: UserRead = Depends(require_roles(Role.OWNER, Role.DPO)),
):
    check_document_access(document_id, current_user, db)

    risk = (
        db.query(RopaRiskAssessmentModel)
        .filter(RopaRiskAssessmentModel.document_id == document_id)
        .first()
    )
    if not risk:
        raise HTTPException(
            status_code=404, detail="ยังไม่มี Risk Assessment สำหรับเอกสารนี้"
        )

    # Fetch DPO comments for Risk Assessment
    dpo_comms = db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == document_id,
        or_(
            DpoSectionCommentModel.section_key == "DO_RISK",
            DpoSectionCommentModel.section_key == "risk"
        )
    ).all()
    
    suggestions = []
    for comm in dpo_comms:
        suggestions.append({
            "id": str(comm.id),
            "section": comm.section_key,
            "section_id": "risk",
            "comment": comm.comment,
            "reviewer": "DPO (เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล)",
            "date": comm.created_at.isoformat(),
            "status": "OPEN",
            "role": "DPO"
        })
        
    risk_dict = {
        "id": risk.id,
        "document_id": risk.document_id,
        "assessed_by": risk.assessed_by,
        "likelihood": risk.likelihood,
        "impact": risk.impact,
        "risk_score": risk.risk_score,
        "risk_level": risk.risk_level,
        "assessed_at": risk.assessed_at,
        "suggestions": suggestions
    }

    return risk_dict


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
# DELETE /owner/documents/{document_id} — ลบเอกสารทั้งใบ (HARD DELETE เฉพาะ Draft)
# =============================================================================


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="ลบเอกสารออกจากระบบ (Hard Delete เฉพาะ IN_PROGRESS)",
)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    ลบเอกสารออกจากระบบถาวร (HARD DELETE)
    เงื่อนไข:
    1. ต้องเป็นเอกสารที่สถานะ IN_PROGRESS เท่านั้น (ยังไม่เคยส่งตรวจ)
    2. ต้องเป็นเจ้าของเอกสาร (Created By) เท่านั้น
    """
    check_document_access(document_id, current_user, db)

    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    if doc.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="ลบทิ้งทันทีได้เฉพาะเอกสารที่ยังเป็นฉบับร่าง (IN_PROGRESS) เท่านั้น หากส่งตรวจแล้วต้องใช้การยื่นคำร้องลบ",
        )

    # ตรวจสอบความปลอดภัย: ลบได้เฉพาะเจ้าของเท่านั้น
    if doc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบเอกสารนี้")

    db.delete(doc)
    db.commit()
    return None


# =============================================================================
# POST /owner/documents/{document_id}/deletion — ยื่นคำร้องขอทำลาย
# =============================================================================


@router.post(
    "/documents/{document_id}/deletion",
    response_model=DeletionRequestRead,
    summary="ยื่นคำร้องขอทำลายเอกสาร (Soft Delete)",
)
def create_deletion_request(
    document_id: UUID,
    payload: DeletionRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    """
    ยื่นคำร้องขอลบ/ทำลายเอกสาร (Soft Delete)
    สำหรับเอกสารที่ส่งตรวจหรืออนุมัติแล้ว จะสร้าง DocumentDeletionRequestModel เพื่อรอ DPO อนุมัติ
    """
    check_document_access(document_id, current_user, db)

    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    # ป้องกันการยื่นคำร้องซ้ำ
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

    # สแกนหา DPO ล่าสุด
    assigned_dpo_id = None
    last_cycle = (
        db.query(DocumentReviewCycleModel)
        .filter(DocumentReviewCycleModel.document_id == document_id)
        .order_by(DocumentReviewCycleModel.requested_at.desc())
        .first()
    )
    if last_cycle:
        last_assignment = (
            db.query(ReviewDpoAssignmentModel)
            .filter(ReviewDpoAssignmentModel.review_cycle_id == last_cycle.id)
            .first()
        )
        if last_assignment:
            assigned_dpo_id = last_assignment.dpo_id

    # Fallback assignment logic...
    if not assigned_dpo_id:
        priority_dpo = (
            db.query(UserModel)
            .filter(
                UserModel.role == "DPO",
                UserModel.status == "ACTIVE",
                or_(
                    UserModel.first_name.like("%กิตติพงศ์%"),
                    UserModel.username == "DPO01",
                    UserModel.email == "DPO01",
                ),
            )
            .first()
        )
        if priority_dpo:
            assigned_dpo_id = priority_dpo.id
        else:
            dpo_candidates = (
                db.query(UserModel)
                .filter(UserModel.role == "DPO", UserModel.status == "ACTIVE")
                .all()
            )
            if not dpo_candidates:
                raise HTTPException(status_code=400, detail="ไม่พบ DPO ที่พร้อมใช้งานในระบบ")
            assigned_dpo_id = random.choice(dpo_candidates).id

    req = DocumentDeletionRequestModel(
        document_id=document_id,
        requested_by=current_user.id,
        owner_reason=payload.owner_reason,
        dpo_id=assigned_dpo_id,
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
            status_code=400, detail="ลบได้เฉพาะ owner section ที่ยังเป็น DRAFT เท่านั้น"
        )

    db.delete(owner_section)
    db.commit()
