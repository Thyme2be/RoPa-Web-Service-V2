"""
documents.py ─ ROPA Document API endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.rbac import (
    Role,
    build_document_filter,
    check_document_access,
    require_roles,
)
from app.models.assignment import AuditorAssignmentModel, ProcessorAssignmentModel
from app.models.document import RopaDocumentModel
from app.models.section_owner import RopaOwnerSectionModel
from app.models.section_processor import RopaProcessorSectionModel
from app.models.user import UserModel
from app.models.workflow import DocumentReviewCycleModel, ReviewDpoAssignmentModel
from app.schemas.document import (
    AuditorAssignmentRead,
    DocumentCreate,
    DocumentDetailRead,
    DocumentRead,
    OwnerSectionRead,
    ProcessorAssignmentRead,
    ProcessorSectionRead,
    DpoAssignRequest,
    AuditorAssignRequest,
    DeletionRequestRead,
)
from app.schemas.enums import DocumentStatusEnum
from app.schemas.user import UserRead
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/documents")


def _map_owner_section(s: RopaOwnerSectionModel) -> OwnerSectionRead:
    data_sources = [src.source.lower() for src in s.data_sources if src.source]
    return OwnerSectionRead(
        id=s.id,
        document_id=s.document_id,
        owner_id=s.owner_id,
        status=s.status,
        title_prefix=s.title_prefix,
        first_name=s.first_name,
        last_name=s.last_name,
        address=s.address,
        email=s.email,
        phone=s.phone,
        contact_email=s.contact_email,
        company_phone=s.company_phone,
        data_owner_name=s.data_owner_name,
        processing_activity=s.processing_activity,
        purpose_of_processing=s.purpose_of_processing,
        personal_data_categories=[item.type for item in s.personal_data_items if item.type],
        subject_categories=[cat.category for cat in s.data_categories if cat.category],
        data_types=[dt.type for dt in s.data_types if dt.type],
        collection_method=s.collection_methods[0].method if s.collection_methods else None,
        data_source_direct="direct" in data_sources,
        data_source_indirect="indirect" in data_sources,
        data_source_other=s.data_source_other,
        storage_types=[st.type for st in s.storage_types if st.type],
        storage_methods=[sm.method for sm in s.storage_methods if sm.method],
        retention_value=s.retention_value,
        retention_unit=s.retention_unit,
        access_condition=s.access_control_policy,
        destruction_method=s.deletion_method,
        legal_basis=s.legal_basis,
        minor_consent_types=[t.type for t in s.minor_consent_types if t.type],
        has_cross_border_transfer=s.has_cross_border_transfer or False,
        transfer_country=s.transfer_country,
        transfer_company=s.transfer_in_group, # Map transfer_in_group to transfer_company for Owner
        transfer_method=s.transfer_method,
        transfer_protection_standard=s.transfer_protection_standard,
        transfer_exception=s.transfer_exception,
        exemption_usage=s.exemption_usage,
        refusal_handling=s.refusal_handling,
        org_measures=s.org_measures,
        access_control_measures=s.access_control_measures,
        technical_measures=s.technical_measures,
        responsibility_measures=s.responsibility_measures,
        physical_measures=s.physical_measures,
        audit_measures=s.audit_measures,
        updated_at=s.updated_at,
    )


def _map_processor_section(s: RopaProcessorSectionModel) -> ProcessorSectionRead:
    return ProcessorSectionRead(
        id=s.id,
        document_id=s.document_id,
        processor_id=s.processor_id,
        status=s.status,
        title_prefix=s.title_prefix,
        first_name=s.first_name,
        last_name=s.last_name,
        address=s.address,
        email=s.email,
        phone=s.phone,
        processor_name=s.processor_name,
        controller_name=s.controller_name,
        controller_address=s.controller_address,
        processing_activity=s.processing_activity,
        purpose_of_processing=s.purpose_of_processing,
        personal_data_categories=[item.type for item in s.personal_data_items if item.type],
        subject_categories=[cat.category for cat in s.data_categories if cat.category],
        data_types=[dt.type for dt in s.data_types if dt.type],
        collection_methods=[m.method for m in s.collection_methods if m.method],
        data_sources=[src.source for src in s.data_sources if src.source],
        data_source_other=s.data_source_other,
        storage_types=[st.type for st in s.storage_types if st.type],
        storage_methods=[sm.method for sm in s.storage_methods if sm.method],
        storage_methods_other=s.storage_methods_other,
        retention_value=s.retention_value,
        retention_unit=s.retention_unit,
        access_condition=s.access_condition,
        destruction_method=s.deletion_method,
        legal_basis=s.legal_basis,
        has_cross_border_transfer=s.has_cross_border_transfer or False,
        transfer_country=s.transfer_country,
        transfer_company=s.transfer_company,
        transfer_method=s.transfer_method,
        transfer_protection_standard=s.transfer_protection_standard,
        transfer_exception=s.transfer_exception,
        org_measures=s.org_measures,
        access_control_measures=s.access_control_measures,
        technical_measures=s.technical_measures,
        responsibility_measures=s.responsibility_measures,
        physical_measures=s.physical_measures,
        audit_measures=s.audit_measures,
        updated_at=s.updated_at,
    )


def _build_document_detail(
    doc: RopaDocumentModel,
    current_user: UserRead,
    db: Session,
) -> DocumentDetailRead:

    role = current_user.role

    owner_sections = (
        [
            _map_owner_section(s)
            for s in db.query(RopaOwnerSectionModel)
            .filter(RopaOwnerSectionModel.document_id == doc.id)
            .all()
        ]
        if role != Role.EXECUTIVE
        else []
    )

    if role == Role.PROCESSOR:
        proc_sections = [
            _map_processor_section(s)
            for s in db.query(RopaProcessorSectionModel)
            .filter(
                RopaProcessorSectionModel.document_id == doc.id,
                RopaProcessorSectionModel.processor_id == current_user.id,
            )
            .all()
        ]
    elif role == Role.EXECUTIVE:
        proc_sections = []
    else:
        proc_sections = [
            _map_processor_section(s)
            for s in db.query(RopaProcessorSectionModel)
            .filter(RopaProcessorSectionModel.document_id == doc.id)
            .all()
        ]

    # Get the latest risk assessment if any
    risk_assessment = None
    if doc.risk_assessments:
        risk_assessment = doc.risk_assessments[-1]

    return DocumentDetailRead(
        **DocumentRead.model_validate(doc).model_dump(),
        owner_sections=owner_sections,
        processor_sections=proc_sections,
        processor_assignments=(
            [
                ProcessorAssignmentRead.model_validate(a)
                for a in doc.processor_assignments
            ]
            if role in (Role.ADMIN, Role.OWNER)
            else []
        ),
        auditor_assignments=(
            [AuditorAssignmentRead.model_validate(a) for a in doc.auditor_assignments]
            if role in (Role.ADMIN, Role.AUDITOR, Role.DPO)
            else []
        ),
        deletion_requests=(
            [DeletionRequestRead.model_validate(r) for r in doc.deletion_requests]
            if role in (Role.ADMIN, Role.DPO, Role.OWNER)
            else []
        ),
        risk_assessment=risk_assessment,
    )


@router.get(
    "",
    response_model=List[DocumentRead],
    summary="List Documents",
    tags=["Documents (Shared)"],
)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    doc_filter = build_document_filter(current_user, db)
    documents = (
        db.query(RopaDocumentModel)
        .filter(doc_filter)
        .order_by(RopaDocumentModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return documents


@router.post(
    "",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create Document",
    tags=["Documents (Owner)"],
)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(
        require_roles(Role.OWNER, Role.DPO, Role.ADMIN, Role.EXECUTIVE)
    ),
):
    doc = RopaDocumentModel(
        title=payload.title,
        description=payload.description,
        created_by=current_user.id,
        review_interval_days=payload.review_interval_days,
        due_date=payload.due_date,
        processor_company=payload.processor_company,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get(
    "/{document_id}",
    response_model=DocumentDetailRead,
    summary="Get Document Detail",
    tags=["Documents (Shared)"],
)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    check_document_access(document_id, current_user, db)
    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    return _build_document_detail(doc, current_user, db)


@router.post(
    "/{document_id}/assign-dpo",
    status_code=status.HTTP_201_CREATED,
    summary="Assign DPO to Document",
    tags=["Documents (Owner)"],
)
def assign_dpo(
    document_id: UUID,
    payload: DpoAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)
    doc = (
        db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Create Review Cycle
    cycle = DocumentReviewCycleModel(
        document_id=document_id,
        requested_by=current_user.id,
        cycle_number=1,
    )
    db.add(cycle)
    db.flush()

    # Assign DPO
    dpo_assignment = ReviewDpoAssignmentModel(
        review_cycle_id=cycle.id, dpo_id=payload.dpo_id, assignment_method="MANUAL"
    )
    db.add(dpo_assignment)
    db.commit()
    return {"message": "DPO assigned successfully."}


@router.post(
    "/{document_id}/assign-auditor",
    status_code=status.HTTP_201_CREATED,
    summary="Assign Auditor to Document",
    tags=["Documents (DPO)"],
)
def assign_auditor(
    document_id: UUID,
    payload: AuditorAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    check_document_access(document_id, current_user, db)

    # Must ensure the document has DPO Review Cycle that includes the current DPO
    dpo_assignment = (
        db.query(ReviewDpoAssignmentModel)
        .join(DocumentReviewCycleModel)
        .filter(
            DocumentReviewCycleModel.document_id == document_id,
            ReviewDpoAssignmentModel.dpo_id == current_user.id,
        )
        .first()
    )

    if not dpo_assignment:
        raise HTTPException(
            status_code=403, detail="You are not assigned as the DPO for this document."
        )

    # Find the Auditor in the users table by Title, First Name, and Last Name (Case-insensitive)
    auditor_user = (
        db.query(UserModel)
        .filter(
            UserModel.title.ilike(payload.title),
            UserModel.first_name.ilike(payload.first_name),
            UserModel.last_name.ilike(payload.last_name),
            UserModel.role == Role.AUDITOR,
        )
        .first()
    )

    if not auditor_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ไม่พบผู้ตรวจสอบรายนี้ ({payload.title} {payload.first_name} {payload.last_name}) ในระบบ กรุณาตรวจสอบการสะกดชื่อหรือลงทะเบียนผู้ใช้ก่อน",
        )

    auditor_assignment = AuditorAssignmentModel(
        document_id=document_id,
        auditor_id=auditor_user.id,
        assigned_by=current_user.id,
        auditor_type=payload.auditor_type,
        department=payload.department,
        preferred_title=payload.title,
        preferred_first_name=payload.first_name,
        preferred_last_name=payload.last_name,
        due_date=payload.due_date,
    )
    db.add(auditor_assignment)
    
    db.commit()
    return {"message": "Auditor assigned successfully."}
