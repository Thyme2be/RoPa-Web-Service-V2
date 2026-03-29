from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.document import RopaDocument, DocumentStatus
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdateOwner,
    DocumentUpdateProcessor,
    DocumentProvideFeedback,
    DocumentResponse
)
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()

# Data Owner Endpoints
@router.post("/", response_model=DocumentResponse)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    new_doc = RopaDocument(
        owner_id=current_user.id,
        owner_data=doc_in.owner_data,
        status=DocumentStatus.DRAFT
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/dashboard/owner", response_model=List[DocumentResponse])
def get_owner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    return db.query(RopaDocument).filter(RopaDocument.owner_id == current_user.id).all()

@router.put("/{id}/owner", response_model=DocumentResponse)
def update_document_owner(
    id: UUID,
    doc_in: DocumentUpdateOwner,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    if doc_in.processor_id is not None:
        doc.processor_id = doc_in.processor_id
    if doc_in.owner_data is not None:
        doc.owner_data = doc_in.owner_data
    if doc_in.status is not None:
        doc.status = doc_in.status
        
    db.commit()
    db.refresh(doc)
    return doc

# Data Processor Endpoints
@router.get("/dashboard/processor", response_model=List[DocumentResponse])
def get_processor_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data processor"]))
):
    return db.query(RopaDocument).filter(RopaDocument.processor_id == current_user.id).all()

@router.put("/{id}/processor", response_model=DocumentResponse)
def fill_processor_data(
    id: UUID,
    doc_in: DocumentUpdateProcessor,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data processor"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id, RopaDocument.processor_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    if doc_in.processor_data is not None:
        doc.processor_data = doc_in.processor_data
    if doc_in.status is not None:
        doc.status = doc_in.status
        
    db.commit()
    db.refresh(doc)
    return doc

# Auditor Endpoints
@router.get("/dashboard/auditor", response_model=List[DocumentResponse])
def get_auditor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Auditor"]))
):
    return db.query(RopaDocument).filter(
        RopaDocument.status.in_([
            DocumentStatus.SUBMITTED_TO_AUDITOR, 
            DocumentStatus.AUDITOR_REJECTED, 
            DocumentStatus.COMPLETED
        ])
    ).all()

@router.put("/{id}/feedback", response_model=DocumentResponse)
def auditor_feedback(
    id: UUID,
    doc_in: DocumentProvideFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Auditor"]))
):
    doc = db.query(RopaDocument).filter(RopaDocument.id == id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.auditor_feedback = doc_in.auditor_feedback
    if doc_in.status is not None:
        doc.status = doc_in.status
        
    db.commit()
    db.refresh(doc)
    return doc
