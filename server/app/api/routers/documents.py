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
from app.schemas.document import (
    AuditorAssignmentRead,
    DocumentCreate,
    DocumentDetailRead,
    DocumentRead,
    OwnerSectionRead,
    ProcessorAssignmentRead,
    ProcessorSectionRead,
)
from app.schemas.user import UserRead
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/documents", tags=["Documents"])


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
    )


@router.get("", response_model=List[DocumentRead], summary="List Documents")
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


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED, summary="Create Document")
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


@router.get("/{document_id}", response_model=DocumentDetailRead, summary="Get Document Detail")
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
):
    check_document_access(document_id, current_user, db)
    doc = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == document_id).first()
    return _build_document_detail(doc, current_user, db)
