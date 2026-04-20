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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

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
) -> ProcessorStatusBadge:
    """
    badge สถานะ DP ใน ตาราง 1 — 2 ค่า:
      DP_DONE    = กดบันทึกเสร็จแล้ว (SUBMITTED)
      WAITING_DP = ยังไม่ได้กรอก หรือ บันทึกฉบับร่างไว้ (DRAFT / ไม่มี section)
    """
    if proc_section and proc_section.status == "SUBMITTED":
        return ProcessorStatusBadge(label="Data Processor ดำเนินการเสร็จสิ้น", code="DP_DONE")
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

def _load_processor_section_full(
    section: RopaProcessorSectionModel,
    db: Session,
) -> ProcessorSectionFullRead:
    """
    โหลด Processor Section พร้อม sub-tables ทั้งหมด
    (เรียกใช้จาก owner.py ด้วยเมื่อ DO ต้องการดู Processor Section)
    """
    sid = section.id

    personal_data_items = db.query(ProcessorPersonalDataItemModel).filter_by(processor_section_id=sid).all()
    data_categories     = db.query(ProcessorDataCategoryModel).filter_by(processor_section_id=sid).all()
    data_types          = db.query(ProcessorDataTypeModel).filter_by(processor_section_id=sid).all()
    collection_methods  = db.query(ProcessorCollectionMethodModel).filter_by(processor_section_id=sid).all()
    data_sources        = db.query(ProcessorDataSourceModel).filter_by(processor_section_id=sid).all()
    storage_types       = db.query(ProcessorStorageTypeModel).filter_by(processor_section_id=sid).all()
    storage_methods     = db.query(ProcessorStorageMethodModel).filter_by(processor_section_id=sid).all()

    return ProcessorSectionFullRead(
        id=section.id,
        document_id=section.document_id,
        processor_id=section.processor_id,
        status=section.status,
        updated_at=section.updated_at,
        do_suggestion=section.do_suggestion,
        title_prefix=section.title_prefix,
        first_name=section.first_name,
        last_name=section.last_name,
        address=section.address,
        email=section.email,
        phone=section.phone,
        processor_name=section.processor_name,
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
        access_policy=section.access_policy,
        deletion_method=section.deletion_method,
        legal_basis=section.legal_basis,
        has_cross_border_transfer=section.has_cross_border_transfer,
        transfer_country=section.transfer_country,
        transfer_in_group=section.transfer_in_group,
        transfer_method=section.transfer_method,
        transfer_protection_standard=section.transfer_protection_standard,
        transfer_exception=section.transfer_exception,
        org_measures=section.org_measures,
        access_control_measures=section.access_control_measures,
        technical_measures=section.technical_measures,
        responsibility_measures=section.responsibility_measures,
        physical_measures=section.physical_measures,
        audit_measures=section.audit_measures,
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
    response_model=ProcessorAssignedTableResponse,
    summary="ตารางเอกสารของ Data Processor (แยก 2 กลุ่ม)",
)
def get_assigned_table(
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

    assignments = (
        db.query(ProcessorAssignmentModel)
        .join(RopaDocumentModel, ProcessorAssignmentModel.document_id == RopaDocumentModel.id)
        .filter(
            ProcessorAssignmentModel.processor_id == uid,
            or_(
                RopaDocumentModel.deletion_status == None,
                RopaDocumentModel.deletion_status != "DELETED",
            ),
        )
        .order_by(ProcessorAssignmentModel.created_at.desc())
        .all()
    )

    active_items = []
    draft_items = []

    for assignment in assignments:
        doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == assignment.document_id).first()
        if not doc:
            continue

        proc_section = (
            db.query(RopaProcessorSectionModel)
            .filter(
                RopaProcessorSectionModel.document_id == doc.id,
                RopaProcessorSectionModel.processor_id == uid,
            )
            .first()
        )

        # หา DO name
        do_user = db.query(UserModel).filter(UserModel.id == doc.created_by).first()

        # หา Owner Status (DO Status)
        owner_section = db.query(RopaOwnerSectionModel).filter(RopaOwnerSectionModel.document_id == doc.id).first()
        owner_status = None
        if owner_section:
            if owner_section.status == "SUBMITTED":
                owner_status = ProcessorStatusBadge(label="Data Owner ดำเนินการเสร็จสิ้น", code="DO_DONE")
            else:
                owner_status = ProcessorStatusBadge(label="รอส่วนของ Data Owner", code="WAITING_DO")

        # feedback ที่ยังเปิดอยู่ (จาก DO หรือ DPO)
        has_open_feedback = False
        if proc_section:
            has_open_do_feedback = (
                db.query(ReviewFeedbackModel)
                .filter(
                    ReviewFeedbackModel.to_user_id == uid,
                    ReviewFeedbackModel.target_id == proc_section.id,
                    ReviewFeedbackModel.status == "OPEN",
                )
                .first()
                is not None
            )
            has_open_dpo_comment = (
                db.query(DpoSectionCommentModel)
                .filter(
                    DpoSectionCommentModel.document_id == doc.id,
                    DpoSectionCommentModel.section_key.like("DP_SEC_%"),
                )
                .first()
                is not None
            )
            has_open_feedback = has_open_do_feedback or has_open_dpo_comment

        # ทุกเอกสารขึ้นในตารางดำเนินการ
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
            owner_title=do_user.title if do_user else None,
            owner_first_name=do_user.first_name if do_user else None,
            owner_last_name=do_user.last_name if do_user else None,
            status=_processor_status_badge(proc_section),
            owner_status=owner_status,
            has_open_feedback=has_open_feedback,
            created_at=doc.created_at,
        ))

        # เฉพาะ DRAFT เท่านั้นที่ขึ้นในตารางฉบับร่าง
        if proc_section and proc_section.status == "DRAFT":
            draft_items.append(ProcessorDraftTableItem(
                document_id=doc.id,
                document_number=doc.document_number,
                title=doc.title,
                processor_section_id=proc_section.id if proc_section else None,
                last_saved_at=proc_section.updated_at if proc_section else None,
            ))

    return {
        "active": active_items,
        "drafts": draft_items,
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
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Processor Section สำหรับเอกสารนี้")

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
        "processor_name", "controller_address", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "access_policy", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_in_group", "transfer_method", "transfer_protection_standard",
        "transfer_exception",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_processor_sub_tables(section.id, payload, db)

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
    badge ในตารางจะแสดง "Data Processor ดำเนินการเสร็จสิ้น"
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
        "processor_name", "controller_address", "processing_activity", "purpose_of_processing",
        "data_source_other", "retention_value", "retention_unit",
        "access_policy", "deletion_method",
        "legal_basis", "has_cross_border_transfer", "transfer_country",
        "transfer_in_group", "transfer_method", "transfer_protection_standard",
        "transfer_exception",
        "org_measures", "access_control_measures", "technical_measures",
        "responsibility_measures", "physical_measures", "audit_measures",
    ]
    for field in scalar_fields:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(section, field, value)

    _replace_processor_sub_tables(section.id, payload, db)

    section.status = "SUBMITTED"

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

    db.commit()
    db.refresh(section)
    return _load_processor_section_full(section, db)


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
    "/documents/{document_id}/send-to-do",
    response_model=MessageResponse,
    summary="DP ส่งเอกสารให้ DO (หลัง submit แล้ว)",
)
def send_to_do(
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
