"""
processor.py ─ Data Processor API endpoints

DP เห็นเฉพาะเอกสารของตัวเอง (ที่ถูก assign) ไม่เห็น Owner Section ของ DO
DO เป็นฝ่ายส่ง feedback มาหา DP (ไม่ใช่ทางกลับกัน)

Routes:
  GET    /processor/tables/assigned                ตารางเอกสารที่ DP ถูก assign

  Processor Section (กรอกแบบฟอร์มของตัวเอง):
  GET    /processor/documents/{id}/section         ดู/กรอก Processor Section
  PATCH  /processor/documents/{id}/section         บันทึกฉบับร่าง (ไม่เปลี่ยน status)
  POST   /processor/documents/{id}/section/submit  บันทึก = เปลี่ยน status เป็น SUBMITTED

  Snapshots (Draft management):
  POST   /processor/documents/{id}/snapshot        บันทึกฉบับร่างแยก (Snapshot)
  GET    /processor/snapshots                     รายการฉบับร่างทั้งหมด
  GET    /processor/snapshots/{id}                 ดูเนื้อหาฉบับร่าง
  DELETE /processor/snapshots/{id}                 ลบฉบับร่าง
"""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, contains_eager

from app.api.deps import get_current_user, get_db
from app.core.rbac import Role, check_document_access, require_roles
from app.models.assignment import ProcessorAssignmentModel
from app.models.document import RopaDocumentModel
from app.models.section_owner import RopaOwnerSectionModel
from app.models.user import UserModel
from app.models.dpo_comment import DpoSectionCommentModel
from app.models.workflow import ReviewAssignmentModel, DocumentReviewCycleModel, ReviewFeedbackModel
from app.models.section_processor import (
    ProcessorCollectionMethodModel,
    ProcessorDataCategoryModel,
    ProcessorDataSourceModel,
    ProcessorDataTypeModel,
    ProcessorPersonalDataItemModel,
    ProcessorStorageMethodModel,
    ProcessorStorageTypeModel,
    RopaProcessorSectionModel,
)
from app.models.section_snapshots import RopaProcessorSnapshotModel

from app.schemas.enums import RopaSectionEnum
from app.schemas.owner import (
    DataCategoryOut,
    DataSourceOut,
    DataTypeOut,
    CollectionMethodOut,
    FeedbackRead,
    PersonalDataItemOut,
    StorageMethodOut,
    StorageTypeOut,
)
from app.schemas.processor import (
    ProcessorAssignedTableItem,
    ProcessorAssignedTablePaginated,
    ProcessorDraftTableItem,
    ProcessorSectionFullRead,
    ProcessorSectionSave,
    ProcessorStatusBadge,
    ProcessorAssignedTableResponse,
    ProcessorFeedbackResponse,
    DpoCommentForDpRead,
    MessageResponse,
    ProcessorSnapshotRead,
    ProcessorSnapshotTableItem,
)

from app.schemas.user import UserRead

router = APIRouter(prefix="/processor", tags=["Data Processor"])


# =============================================================================
# Helper: Owner status badge (มุมมอง DP)
# =============================================================================

def _processor_status_badge(
    proc_section: Optional[RopaProcessorSectionModel],
    doc_status: str,
    has_open_feedback: bool
) -> ProcessorStatusBadge:
    """
    Unified status badge for Data Processor based on the document lifecycle:
    1. CHECK_DONE   = Document is COMPLETED
    2. DP_NEED_FIX  = DP submitted (SUBMITTED) but has open feedback
    3. WAITING_CHECK = DP submitted (SUBMITTED) and waiting for verification
    4. WAITING_DP   = DP hasn't submitted (DRAFT or no section)
    """
    if doc_status == "COMPLETED":
        return ProcessorStatusBadge(label="ตรวจสอบเสร็จสิ้น", code="CHECK_DONE")
    
    if proc_section and proc_section.status == "SUBMITTED":
        if has_open_feedback:
            return ProcessorStatusBadge(label="รอ Data Processor แก้ไข", code="DP_NEED_FIX")
        if not proc_section.is_sent:
            return ProcessorStatusBadge(label="กรอกข้อมูลเสร็จสิ้น (รอส่ง)", code="WAITING_CHECK")
        return ProcessorStatusBadge(label="รอตรวจสอบ", code="WAITING_CHECK")
    
    if has_open_feedback:
        # DO or DPO rejected
        return ProcessorStatusBadge(label="DPO แจ้งแก้ไข", code="DPO_REJECTED")

    return ProcessorStatusBadge(label="รอส่วนของ Data Processor", code="WAITING_DP")


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
# Helper: Load ProcessorSectionFullRead with sub-tables
# =============================================================================

def _load_processor_section_full(section: RopaProcessorSectionModel, db: Session, requester_role: Optional[Role] = None) -> ProcessorSectionFullRead:
    """
    โหลด Processor Section พร้อม sub-tables ทั้งหมด
    - requester_role: หากเป็น Role.OWNER และ section.is_sent=False จะคืนข้อมูลเปล่า
    """
    sid = section.id

    # Check isolation for Data Owner
    is_isolated = requester_role == Role.OWNER and not section.is_sent

    if is_isolated:
        return ProcessorSectionFullRead(
            id=section.id,
            document_id=section.document_id,
            processor_id=section.processor_id,
            status=section.status,
            is_sent=section.is_sent,
            updated_at=section.updated_at,
            do_suggestion=section.do_suggestion,
            # Ensure scalar fields are None for isolation
            # Relationships default to [] in the schema, but we can be explicit
            personal_data_items=[],
            data_categories=[],
            data_types=[],
            collection_methods=[],
            data_sources=[],
            storage_types=[],
            storage_methods=[],
            feedbacks=[],
        )

    # Fetch feedbacks related to this processor section
    feedbacks_list = (
        db.query(ReviewFeedbackModel)
        .filter(
            ReviewFeedbackModel.target_type == "PROCESSOR_SECTION",
            ReviewFeedbackModel.target_id == section.id
        )
        .all()
    )
    
    # Map to list of objects (dictionaries) so we can append DPO comments
    feedbacks = [ReviewFeedbackOut.model_validate(fb).model_dump() for fb in feedbacks_list]

    # ALSO: Fetch DPO comments for this document that are meant for DP
    dpo_comms = db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == section.document_id,
        or_(
            DpoSectionCommentModel.section_key.in_([str(i) for i in range(1, 7)]),
            DpoSectionCommentModel.section_key.like("DP_SEC_%")
        )
    ).all()

    for comm in dpo_comms:
        # Map DPO comment to the same structure as ReviewFeedback
        feedbacks.append({
            "id": comm.id,
            "review_cycle_id": comm.review_cycle_id,
            "section_number": 1, # Placeholder
            "from_user_id": comm.created_by,
            "to_user_id": section.processor_id,
            "target_type": "PROCESSOR_SECTION",
            "target_id": section.id,
            "field_name": comm.section_key, # Use key as field name for context
            "comment": comm.comment,
            "status": "OPEN",
            "created_at": comm.created_at,
            "resolved_at": None,
            "from_user_name": "DPO Suggestion" # Helpful for UI
        })

    # relationships are now eagerly loaded
    personal_data_items = section.personal_data_items
    data_categories     = section.data_categories
    data_types          = section.data_types
    collection_methods  = section.collection_methods
    data_sources        = section.data_sources
    storage_types       = section.storage_types
    storage_methods     = section.storage_methods

    return ProcessorSectionFullRead(
        id=section.id,
        document_id=section.document_id,
        processor_id=section.processor_id,
        status=section.status,
        is_sent=section.is_sent,
        updated_at=section.updated_at,
        do_suggestion=section.do_suggestion,
        title_prefix=section.title_prefix,
        first_name=section.first_name,
        last_name=section.last_name,
        address=section.address,
        email=section.email,
        phone=section.phone,
        processor_name=section.processor_name,
        controller_name=section.controller_name,
        controller_address=section.controller_address,
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
        storage_methods_other=section.storage_methods_other,
        access_condition=section.access_condition,
        deletion_method=section.deletion_method,
        legal_basis=section.legal_basis,
        has_cross_border_transfer=section.has_cross_border_transfer,
        transfer_country=section.transfer_country,
        transfer_company=section.transfer_company,
        transfer_method=section.transfer_method,
        transfer_protection_standard=section.transfer_protection_standard,
        transfer_exception=section.transfer_exception,
        org_measures=section.org_measures,
        access_control_measures=section.access_control_measures,
        technical_measures=section.technical_measures,
        responsibility_measures=section.responsibility_measures,
        physical_measures=section.physical_measures,
        audit_measures=section.audit_measures,
        feedbacks=feedbacks
    )


# =============================================================================
# Helper: Save Processor sub-tables (replace-all pattern)
# =============================================================================

def _replace_processor_sub_tables(
    section_id: UUID,
    payload: ProcessorSectionSave,
    db: Session,
):
    """อัปเดต sub-tables ของ Processor Section โดยลบของเก่าแล้ว insert ใหม่"""
    if payload.personal_data_items is not None:
        db.query(ProcessorPersonalDataItemModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.personal_data_items:
            db.add(ProcessorPersonalDataItemModel(processor_section_id=section_id, **item.model_dump()))

    if payload.data_categories is not None:
        db.query(ProcessorDataCategoryModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.data_categories:
            db.add(ProcessorDataCategoryModel(processor_section_id=section_id, **item.model_dump()))

    if payload.data_types is not None:
        db.query(ProcessorDataTypeModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.data_types:
            db.add(ProcessorDataTypeModel(processor_section_id=section_id, **item.model_dump()))

    if payload.collection_methods is not None:
        db.query(ProcessorCollectionMethodModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.collection_methods:
            db.add(ProcessorCollectionMethodModel(processor_section_id=section_id, **item.model_dump()))

    if payload.data_sources is not None:
        db.query(ProcessorDataSourceModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.data_sources:
            db.add(ProcessorDataSourceModel(processor_section_id=section_id, **item.model_dump()))

    if payload.storage_types is not None:
        db.query(ProcessorStorageTypeModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.storage_types:
            db.add(ProcessorStorageTypeModel(processor_section_id=section_id, **item.model_dump()))

    if payload.storage_methods is not None:
        db.query(ProcessorStorageMethodModel).filter_by(processor_section_id=section_id).delete()
        for item in payload.storage_methods:
            db.add(ProcessorStorageMethodModel(processor_section_id=section_id, **item.model_dump()))


# =============================================================================
# Snapshots (Drafts) — บันทึกสแนปชอตแยกจากงานหลัก
# =============================================================================

@router.post(
    "/documents/{id}/snapshot",
    response_model=ProcessorSnapshotRead,
    summary="บันทึกสแนปชอต (Save as Draft) ของ Processor Section",
)
def create_processor_snapshot(
    id: UUID,
    payload: ProcessorSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    บันทึกข้อมูลฟอร์มปัจจุบันเป็นสแนปชอตแยกต่างหาก (ฉบับร่าง)
    - ไม่กระทบข้อมูลในตารางหลัก
    """
    doc = db.query(RopaDocumentModel).filter_by(id=id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    existing_snapshot = db.query(RopaProcessorSnapshotModel).filter_by(
        document_id=id,
        user_id=current_user.id
    ).first()

    if existing_snapshot:
        existing_snapshot.data = payload.model_dump(exclude_none=True)
        # Update timestamp to reflect latest save
        existing_snapshot.created_at = datetime.utcnow()
        snapshot = existing_snapshot
    else:
        snapshot = RopaProcessorSnapshotModel(
            document_id=id,
            user_id=current_user.id,
            data=payload.model_dump(exclude_none=True),
        )
        db.add(snapshot)
    
    db.commit()
    db.refresh(snapshot)

    return ProcessorSnapshotRead(
        id=snapshot.id,
        document_id=snapshot.document_id,
        document_number=doc.document_number,
        title=doc.title,
        data=snapshot.data,
        created_at=snapshot.created_at,
    )


@router.get(
    "/snapshots",
    response_model=List[ProcessorSnapshotTableItem],
    summary="ดึงรายการฉบับร่าง (Snapshots) ทั้งหมดของ Data Processor",
)
def list_processor_snapshots(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    rows = (
        db.query(RopaProcessorSnapshotModel, RopaDocumentModel.document_number, RopaDocumentModel.title)
        .join(RopaDocumentModel, RopaProcessorSnapshotModel.document_id == RopaDocumentModel.id)
        .filter(RopaProcessorSnapshotModel.user_id == current_user.id)
        .order_by(RopaProcessorSnapshotModel.created_at.desc())
        .all()
    )

    result = []
    for snapshot, doc_num, title in rows:
        result.append(ProcessorSnapshotTableItem(
            id=snapshot.id,
            document_id=snapshot.document_id,
            document_number=doc_num,
            title=title,
            created_at=snapshot.created_at
        ))
    return result


@router.get(
    "/snapshots/{snapshot_id}",
    response_model=ProcessorSnapshotRead,
    summary="ดึงข้อมูลสแนปชอตที่ระบุ (Processor)",
)
def get_processor_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    snapshot = db.query(RopaProcessorSnapshotModel).filter_by(id=snapshot_id, user_id=current_user.id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="ไม่พบฉบับร่าง")
    
    doc = db.query(RopaDocumentModel).filter_by(id=snapshot.document_id).first()
    
    return ProcessorSnapshotRead(
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
    summary="ลบฉบับร่าง (Snapshot) (Processor)",
)
def delete_processor_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    snapshot = db.query(RopaProcessorSnapshotModel).filter_by(id=snapshot_id, user_id=current_user.id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="ไม่พบฉบับร่าง")
    
    db.delete(snapshot)
    db.commit()
    return None


# =============================================================================
# GET /processor/tables/assigned — ตารางเอกสารที่ DP ถูก assign
# =============================================================================

@router.get(
    "/tables/assigned",
    response_model=ProcessorAssignedTablePaginated,
    summary="ตารางเอกสารของ Data Processor (Active Items พร้อม Pagination)",
)
def get_assigned_table(
    page: int = 1,
    limit: int = 3,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    หน้า: ตารางเอกสารของ Data Processor — แยก 2 กลุ่ม:
      - เอกสารที่ดำเนินการ: processor_section.status = SUBMITTED
      - ฉบับร่าง: processor_section.status = DRAFT
    DP ไม่เห็นเอกสารของ DP คนอื่น และไม่เห็นเนื้อหา Owner Section
    """
    uid = current_user.id

    # Base query
    query = (
        db.query(ProcessorAssignmentModel)
        .join(RopaDocumentModel, ProcessorAssignmentModel.document_id == RopaDocumentModel.id)
        .filter(
            ProcessorAssignmentModel.processor_id == uid,
            or_(
                RopaDocumentModel.deletion_status == None,
                RopaDocumentModel.deletion_status != "DELETED",
            ),
        )
    )

    # Search Logic
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                RopaDocumentModel.document_number.ilike(search_pattern),
                RopaDocumentModel.title.ilike(search_pattern)
            )
        )

    # Total count for pagination
    total_items = query.count()
    total_pages = (total_items + limit - 1) // limit

    # Fetch paginated assignments
    assignments = (
        query.options(
            contains_eager(ProcessorAssignmentModel.document).joinedload(RopaDocumentModel.creator),
            contains_eager(ProcessorAssignmentModel.document).joinedload(RopaDocumentModel.processor_sections),
            contains_eager(ProcessorAssignmentModel.document).joinedload(RopaDocumentModel.owner_section)
        )
        .order_by(ProcessorAssignmentModel.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # 2. Prepare for bulk fetching feedbacks and DPO comments
    doc_ids = [a.document_id for a in assignments]
    proc_section_ids = []
    for a in assignments:
        for s in a.document.processor_sections:
            if s.processor_id == uid:
                proc_section_ids.append(s.id)

    # Dictionaries for O(1) status check
    open_feedbacks_sections = set()
    if proc_section_ids:
        fbs = db.query(ReviewFeedbackModel.target_id).filter(
            ReviewFeedbackModel.to_user_id == uid,
            ReviewFeedbackModel.target_id.in_(proc_section_ids),
            ReviewFeedbackModel.status == "OPEN"
        ).all()
        open_feedbacks_sections = {fb.target_id for fb in fbs}

    open_dpo_comments_docs = set()
    if doc_ids:
        comms = db.query(DpoSectionCommentModel.document_id).filter(
            DpoSectionCommentModel.document_id.in_(doc_ids),
            # Support both old DP_SEC_ prefixed keys and new numeric keys (1-6)
            or_(
                DpoSectionCommentModel.section_key.like("DP_SEC_%"),
                DpoSectionCommentModel.section_key.in_([str(i) for i in range(1, 7)])
            )
        ).all()
        open_dpo_comments_docs = {c.document_id for c in comms}

    active_items = []
    draft_items = []

    # 3. Build response using pre-loaded data
    for assignment in assignments:
        doc = assignment.document
        if not doc:
            continue

        # Find the specific processor section for this current_user
        proc_section = next((s for s in doc.processor_sections if s.processor_id == uid), None)
        owner_section = doc.owner_section
        do_user = doc.creator


        # Check for open feedback
        has_open_feedback = False
        if proc_section:
            has_open_do_feedback = proc_section.id in open_feedbacks_sections
            has_open_dpo_comment = doc.id in open_dpo_comments_docs
            has_open_feedback = has_open_do_feedback or has_open_dpo_comment

        # Add to active items
        active_items.append(ProcessorAssignedTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            do_name=_user_full_name(do_user),
            processor_section_id=proc_section.id if proc_section else None,
            processor_section_status=proc_section.status if proc_section else None,
            assignment_status=assignment.status,
            due_date=assignment.due_date,
            received_at=assignment.created_at,
            is_sent=proc_section.is_sent if proc_section else False,
            owner_title=do_user.title if do_user else None,
            owner_first_name=do_user.first_name if do_user else None,
            owner_last_name=do_user.last_name if do_user else None,
            status=_processor_status_badge(proc_section, doc.status, has_open_feedback),
            has_open_feedback=has_open_feedback,
            created_at=doc.created_at,
        ))

        # Add to draft items if applicable
        if proc_section and proc_section.status == "DRAFT" and proc_section.updated_by is not None:
            draft_items.append(ProcessorDraftTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                processor_section_id=proc_section.id,
                last_saved_at=proc_section.updated_at,
            ))

    return {
        "items": active_items,
        "meta": {
            "total": total_items,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }


# =============================================================================
# GET /processor/documents/{document_id}/section — ดู Processor Section
# =============================================================================

@router.get(
    "/documents/{document_id}/section",
    response_model=ProcessorSectionFullRead,
    summary="ดูหรือกรอก Processor Section (Data Processor)",
)
def get_processor_section(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    หน้า: ฟอร์มกรอก Processor Section ของ DP
    - DP เห็นเฉพาะ section ของตัวเอง
    - แสดง do_suggestion จาก DO (คำแนะนำที่ DO เขียนไว้ให้ DP)
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
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if section:
        pass

    return _load_processor_section_full(section, db)


# =============================================================================
# PATCH /processor/documents/{document_id}/section — บันทึกฉบับร่าง
# =============================================================================

@router.patch(
    "/documents/{document_id}/section",
    response_model=ProcessorSectionFullRead,
    summary="บันทึกฉบับร่าง Processor Section (ไม่เปลี่ยน status)",
)
def save_processor_section_draft(
    document_id: UUID,
    payload: ProcessorSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    ปุ่ม "บันทึกฉบับร่าง" — บันทึกข้อมูลโดย status ยังคงเป็น DRAFT
    เปิดมาใหม่ข้อมูลยังคงอยู่
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")

    scalar_fields = [
        "title_prefix", "first_name", "last_name", "address", "email", "phone",
        "processor_name", "controller_name", "controller_address", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "storage_methods_other", "access_condition", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_company", "transfer_method", "transfer_protection_standard",
        "transfer_exception",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_processor_sub_tables(section.id, payload, db)
    
    # บันทึกว่าใครเป็นคนอัปเดตล่าสุด (เพื่อระบุว่าเป็นดราฟท์ที่เริ่มดำเนินการแล้ว)
    section.updated_by = current_user.id
    
    db.commit()
    db.refresh(section)
    return _load_processor_section_full(section, db)


# =============================================================================
# POST /processor/documents/{document_id}/section/submit — บันทึก (SUBMITTED)
# =============================================================================

@router.post(
    "/documents/{document_id}/section/submit",
    response_model=ProcessorSectionFullRead,
    summary="บันทึก Processor Section (เปลี่ยน status เป็น SUBMITTED)",
)
def submit_processor_section(
    document_id: UUID,
    payload: ProcessorSectionSave,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    ปุ่ม "บันทึก" — บันทึกข้อมูล + เปลี่ยน status เป็น SUBMITTED
    แต่ยังไม่ส่งให้ DO (is_sent=False)
    badge ในตาราง DP จะแสดง "Data Processor ดำเนินการเสร็จสิ้น"
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")

    scalar_fields = [
        "title_prefix", "first_name", "last_name", "address", "email", "phone",
        "processor_name", "controller_name", "controller_address", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "storage_methods_other", "access_condition", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_company", "transfer_method", "transfer_protection_standard",
        "transfer_exception",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_processor_sub_tables(section.id, payload, db)

    section.status = RopaSectionEnum.SUBMITTED
    section.is_sent = False
    section.updated_by = current_user.id
    
    db.commit()
    # ปิด open feedbacks ทั้งหมดที่ DO ส่งมาให้ DP (เมื่อ DP submit = แก้ไขแล้ว)
    db.query(ReviewFeedbackModel).filter(
        ReviewFeedbackModel.to_user_id == current_user.id,
        ReviewFeedbackModel.target_id == section.id,
        ReviewFeedbackModel.status == "OPEN",
    ).update({"status": "RESOLVED", "resolved_at": datetime.now(timezone.utc)})

    # เปลี่ยน assignment status = SUBMITTED ด้วย
    assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(
            ProcessorAssignmentModel.document_id == document_id,
            ProcessorAssignmentModel.processor_id == current_user.id,
        )
        .first()
    )
    if assignment:
        assignment.status = "SUBMITTED"
    
    # หากเคยส่งแล้ว (is_sent=True) ให้คงไว้ เพื่อให้ DO เห็นความคืบหน้า/การแก้ไขทันที
    # และเพื่อให้ DO สามารถประเมินความเสี่ยงต่อได้หากเป็นการแก้ไขเล็กน้อย
    # section.is_sent = False  # ลบการรีเซ็ตออก
    
    # ALSO: Clear DPO comments for DP sections because the user has fixed them
    # Keys for DP: "1", "2", "3", "4", "5", "6" (and old DP_SEC_ keys)
    db.query(DpoSectionCommentModel).filter(
        DpoSectionCommentModel.document_id == document_id,
        or_(
            DpoSectionCommentModel.section_key.in_([str(i) for i in range(1, 7)]),
            DpoSectionCommentModel.section_key.like("DP_SEC_%")
        )
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(section)
    return _load_processor_section_full(section, db, Role.PROCESSOR)


# =============================================================================
# POST /processor/documents/{document_id}/section/send — ส่งให้ DO (is_sent=True)
# =============================================================================

@router.post(
    "/documents/{document_id}/section/send",
    response_model=MessageResponse,
    summary="ส่ง Processor Section ให้ Data Owner (เปลี่ยน is_sent เป็น True)",
)
def send_processor_section(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    ปุ่ม "ส่ง" ในตาราง — เปลี่ยน is_sent เป็น True เพื่อให้ Data Owner เห็นข้อมูล
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")

    if section.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="กรุณากรอกข้อมูลและกดบันทึกในฟอร์มให้เสร็จสิ้นก่อนส่ง")

    section.is_sent = True
    db.commit()
    return MessageResponse(message="ส่งข้อมูลให้ Data Owner เรียบร้อยแล้ว")


# =============================================================================
# GET /processor/documents/{document_id}/feedbacks — DP ดู feedback ที่ได้รับจาก DO
# =============================================================================

@router.get(
    "/documents/{document_id}/feedbacks",
    response_model=ProcessorFeedbackResponse,
    summary="DP ดู feedback ที่ได้รับจาก DO และ DPO",
)
def get_received_feedbacks(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    หน้า: DP ดู feedback ที่ได้รับ 2 แหล่ง:
      - from_do  : feedback จาก DO (ReviewFeedbackModel)
      - from_dpo : comment จาก DPO (DpoSectionCommentModel, section_key = DP_SEC_*)
    """
    check_document_access(document_id, current_user, db)

    proc_section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )

    # feedback จาก DO
    from_do = []
    if proc_section:
        feedbacks = (
            db.query(ReviewFeedbackModel)
            .filter(
                ReviewFeedbackModel.to_user_id == current_user.id,
                ReviewFeedbackModel.target_id == proc_section.id,
            )
            .order_by(ReviewFeedbackModel.created_at.desc())
            .all()
        )
        from_do = [FeedbackRead.model_validate(f) for f in feedbacks]

    # comment จาก DPO (DP_SEC_*)
    dpo_comments = (
        db.query(DpoSectionCommentModel)
        .filter(
            DpoSectionCommentModel.document_id == document_id,
            DpoSectionCommentModel.section_key.like("DP_SEC_%"),
        )
        .order_by(DpoSectionCommentModel.created_at.desc())
        .all()
    )
    from_dpo = [DpoCommentForDpRead.model_validate(c) for c in dpo_comments]

    return ProcessorFeedbackResponse(from_do=from_do, from_dpo=from_dpo)


# =============================================================================
# DELETE /processor/documents/{document_id}/section/draft — ล้างข้อมูลฉบับร่าง
# =============================================================================

@router.delete(
    "/documents/{document_id}/section/draft",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="ลบข้อมูลฉบับร่าง Processor Section (เอกสารยังอยู่ใน ตาราง 1)",
)
def delete_processor_section_draft(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    ปุ่มลบในตารางฉบับร่าง
    ลบ processor_section + sub-tables ทั้งหมดออกจาก DB
    เอกสารยังอยู่ใน ตาราง 1 สามารถกดรูปตากรอกใหม่ตั้งแต่ต้น
    เงื่อนไข: processor_section.status ต้องเป็น DRAFT เท่านั้น
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")
    if section.status != "DRAFT":
        raise HTTPException(status_code=400, detail="ลบได้เฉพาะฉบับร่าง (DRAFT) เท่านั้น")

    db.delete(section)
    db.commit()


# =============================================================================
# POST /processor/documents/{document_id}/send-to-do — DP ส่งเอกสารให้ DO
# =============================================================================

@router.post(
    "/documents/{document_id}/section/dispatch",
    response_model=MessageResponse,
    summary="DP ส่งเอกสารให้ DO (หลัง submit แล้ว)",
)
def dispatch_processor_section(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    ปุ่มส่งในตารางเอกสารที่ดำเนินการ
    เงื่อนไข: processor_section.status ต้องเป็น SUBMITTED แล้ว
    เอกสารจะไปแสดงใน Tab 2 ของ DO (Processor Section read-only + คำแนะนำ)
    → เปลี่ยน assignment.status = SUBMITTED (ถ้ายังไม่ได้เปลี่ยน)
    """
    check_document_access(document_id, current_user, db)

    section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section")
    if section.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="ต้องบันทึกฟอร์มให้สมบูรณ์ก่อนส่ง (กด 'บันทึก' ในฟอร์มก่อน)")

    # Mark as sent for visibility
    section.is_sent = True

    assignment = (
        db.query(ProcessorAssignmentModel)
        .filter(
            ProcessorAssignmentModel.document_id == document_id,
            ProcessorAssignmentModel.processor_id == current_user.id,
        )
        .first()
    )
    if assignment and assignment.status != "SUBMITTED":
        assignment.status = "SUBMITTED"

    db.commit()
    return MessageResponse(message="ส่งเอกสารให้ผู้รับผิดชอบข้อมูลสำเร็จ")
