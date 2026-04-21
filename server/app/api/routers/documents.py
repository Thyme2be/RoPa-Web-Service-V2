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
from app.schemas.user import UserRead
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/documents")


def _build_document_detail(
    doc: RopaDocumentModel,
    current_user: UserRead,
    db: Session,
) -> DocumentDetailRead:
    
    role = current_user.role

    owner_sections = [
        OwnerSectionRead.model_validate(s) for s in db.query(RopaOwnerSectionModel).filter(RopaOwnerSectionModel.document_id == doc.id).all()
    ] if role != Role.EXECUTIVE else []

    if role == Role.PROCESSOR:
        proc_sections = [
            ProcessorSectionRead.model_validate(s)
            for s in db.query(RopaProcessorSectionModel).filter(RopaProcessorSectionModel.document_id == doc.id, RopaProcessorSectionModel.processor_id == current_user.id).all()
        ]
    elif role == Role.EXECUTIVE:
        proc_sections = [] 
    else:
        proc_sections = [
            ProcessorSectionRead.model_validate(s) for s in db.query(RopaProcessorSectionModel).filter(RopaProcessorSectionModel.document_id == doc.id).all()
        ]

    return DocumentDetailRead(
        **DocumentRead.model_validate(doc).model_dump(),
        owner_sections=owner_sections,
        processor_sections=proc_sections,
        processor_assignments=[
            ProcessorAssignmentRead.model_validate(a) for a in doc.processor_assignments
        ] if role in (Role.ADMIN, Role.OWNER) else [],
        auditor_assignments=[
            AuditorAssignmentRead.model_validate(a) for a in doc.auditor_assignments
        ] if role in (Role.ADMIN, Role.AUDITOR, Role.DPO) else [],
        deletion_requests=[
            DeletionRequestRead.model_validate(r) for r in doc.deletion_requests
        ] if role in (Role.ADMIN, Role.DPO, Role.OWNER) else [],
    )



@router.get("", response_model=List[DocumentRead], summary="List Documents", tags=["Documents (Shared)"])
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


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Create Document", tags=["Documents (Owner)"])
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER, Role.DPO, Role.ADMIN, Role.EXECUTIVE)),
):
    doc = RopaDocumentModel(
        title=payload.title,
        description=payload.description,
        created_by=current_user.id,
        review_interval_days=payload.review_interval_days,
        due_date=payload.due_date,
        processor_company=payload.processor_company
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}", response_model=DocumentDetailRead, summary="Get Document Detail", tags=["Documents (Shared)"])
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    check_document_access(document_id, current_user, db)
    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    return _build_document_detail(doc, current_user, db)

@router.post("/{document_id}/assign-dpo", status_code=status.HTTP_201_CREATED, summary="Assign DPO to Document", tags=["Documents (Owner)"])
def assign_dpo(
    document_id: UUID,
    payload: DpoAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.OWNER)),
):
    check_document_access(document_id, current_user, db)
    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
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
        review_cycle_id=cycle.id,
        dpo_id=payload.dpo_id,
        assignment_method="MANUAL"
    )
    db.add(dpo_assignment)
    db.commit()
    return {"message": "DPO assigned successfully."}

@router.post("/{document_id}/assign-auditor", status_code=status.HTTP_201_CREATED, summary="Assign Auditor to Document", tags=["Documents (DPO)"])
def assign_auditor(
    document_id: UUID,
    payload: AuditorAssignRequest,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.DPO)),
):
    check_document_access(document_id, current_user, db)
    
    # Must ensure the document has DPO Review Cycle that includes the current DPO
    dpo_assignment = db.query(ReviewDpoAssignmentModel).join(DocumentReviewCycleModel).filter(
        DocumentReviewCycleModel.document_id == document_id,
        ReviewDpoAssignmentModel.dpo_id == current_user.id
    ).first()

    if not dpo_assignment:
        raise HTTPException(status_code=403, detail="You are not assigned as the DPO for this document.")

    # Find the Auditor in the users table by Title, First Name, and Last Name (Case-insensitive)
    auditor_user = db.query(UserModel).filter(
        UserModel.title.ilike(payload.title),
        UserModel.first_name.ilike(payload.first_name),
        UserModel.last_name.ilike(payload.last_name)
    ).first()

    if not auditor_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ไม่พบผู้ตรวจสอบรายนี้ ({payload.title} {payload.first_name} {payload.last_name}) ในระบบ กรุณาตรวจสอบการสะกดชื่อหรือลงทะเบียนผู้ใช้ก่อน"
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
        due_date=payload.due_date
    )
    db.add(auditor_assignment)
    db.commit()
    return {"message": "Auditor assigned successfully."}
