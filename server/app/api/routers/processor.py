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

  Feedback ที่ได้รับจาก DO (DP รับ ไม่ใช่ส่ง):
  GET    /processor/documents/{id}/feedbacks                         ดู feedback ที่ DO ส่งมา
  PATCH  /processor/documents/{id}/feedbacks/{fid}/resolve           ทำ feedback เสร็จแล้ว
"""

from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.rbac import Role, check_document_access, require_roles
from app.models.assignment import ProcessorAssignmentModel
from app.models.document import RopaDocumentModel
from app.models.section_owner import RopaOwnerSectionModel
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
from app.models.workflow import ReviewFeedbackModel
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
    ProcessorSectionFullRead,
    ProcessorSectionSave,
)
from app.schemas.user import UserRead

router = APIRouter(prefix="/processor", tags=["Data Processor"])


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
# GET /processor/tables/assigned — ตารางเอกสารที่ DP ถูก assign
# =============================================================================

@router.get(
    "/tables/assigned",
    response_model=List[ProcessorAssignedTableItem],
    summary="ตารางเอกสารที่ Data Processor ถูก assign",
)
def get_assigned_table(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    หน้า: ตารางเอกสารของ Data Processor
    - แสดงเฉพาะเอกสารที่ DP คนนี้ถูก assign
    - DP ไม่เห็นเอกสารของ DO หรือ DP คนอื่น
    - แสดงว่า DO submit section แล้วหรือยัง (แค่ status flag ไม่ใช่เนื้อหา)
    - แสดงว่ามี feedback จาก DO ที่ยังไม่ได้แก้ไขหรือไม่
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
        .all()
    )

    result = []
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

        # แค่ตรวจว่า Owner Section submit แล้วหรือยัง (ไม่ต้องโหลดเนื้อหา)
        owner_submitted = (
            db.query(RopaOwnerSectionModel)
            .filter(
                RopaOwnerSectionModel.document_id == doc.id,
                RopaOwnerSectionModel.status == "SUBMITTED",
            )
            .first()
            is not None
        )

        # feedback จาก DO ที่ส่งมาหา DP นี้ ที่ยังเปิดอยู่
        # ใช้ target_id = proc_section.id เพราะ review_cycle_id อาจเป็น NULL
        has_open_feedback = False
        if proc_section:
            has_open_feedback = (
                db.query(ReviewFeedbackModel)
                .filter(
                    ReviewFeedbackModel.to_user_id == uid,
                    ReviewFeedbackModel.target_id == proc_section.id,
                    ReviewFeedbackModel.status == "OPEN",
                )
                .first()
                is not None
            )

        result.append(ProcessorAssignedTableItem(
            document_id=doc.id,
            document_number=doc.document_number,
            title=doc.title,
            processor_company=doc.processor_company,
            processor_section_id=proc_section.id if proc_section else None,
            processor_section_status=proc_section.status if proc_section else None,
            assignment_status=assignment.status,
            due_date=assignment.due_date,
            owner_section_submitted=owner_submitted,
            has_open_feedback=has_open_feedback,
            created_at=doc.created_at,
        ))

    return result


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
    response_model=List[FeedbackRead],
    summary="DP ดู feedback ที่ DO ส่งมาให้แก้ไข",
)
def get_received_feedbacks(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    หน้า: DP ดู feedback ที่ DO ส่งมาสำหรับเอกสารนี้
    DO เป็นฝ่ายส่ง feedback มาหา DP (ไม่ใช่ทางกลับกัน)
    DP แค่รับ feedback และแก้ไขตาม
    """
    check_document_access(document_id, current_user, db)

    # หา processor_section ของเอกสารนี้ เพื่อ scope feedbacks ด้วย target_id
    proc_section = (
        db.query(RopaProcessorSectionModel)
        .filter(
            RopaProcessorSectionModel.document_id == document_id,
            RopaProcessorSectionModel.processor_id == current_user.id,
        )
        .first()
    )
    if not proc_section:
        return []

    # ใช้ outerjoin เพราะ review_cycle_id อาจเป็น NULL (DO ส่ง feedback ก่อนมี review cycle)
    feedbacks = (
        db.query(ReviewFeedbackModel)
        .filter(
            ReviewFeedbackModel.to_user_id == current_user.id,
            ReviewFeedbackModel.target_id == proc_section.id,
        )
        .order_by(ReviewFeedbackModel.created_at.desc())
        .all()
    )
    return feedbacks


# =============================================================================
# PATCH /processor/documents/{document_id}/feedbacks/{feedback_id}/resolve
# =============================================================================

@router.patch(
    "/documents/{document_id}/feedbacks/{feedback_id}/resolve",
    response_model=FeedbackRead,
    summary="DP ทำ feedback เสร็จแล้ว (RESOLVED)",
)
def resolve_feedback(
    document_id: UUID,
    feedback_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.PROCESSOR)),
):
    """
    DP แก้ไขตาม feedback จาก DO แล้ว กด "ทำเสร็จแล้ว"
    เปลี่ยน feedback.status = RESOLVED
    """
    check_document_access(document_id, current_user, db)

    feedback = (
        db.query(ReviewFeedbackModel)
        .filter(
            ReviewFeedbackModel.id == feedback_id,
            ReviewFeedbackModel.to_user_id == current_user.id,
        )
        .first()
    )
    if not feedback:
        raise HTTPException(status_code=404, detail="ไม่พบ feedback หรือคุณไม่ใช่ผู้รับ feedback นี้")

    feedback.status = "RESOLVED"
    feedback.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(feedback)
    return feedback
