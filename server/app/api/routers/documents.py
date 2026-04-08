from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRoleEnum
from app.models.document import RopaDocument, DocumentStatus, OwnerRecord, ProcessorRecord, AuditorAudit
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdateOwner,
    DocumentUpdateProcessor,
    DocumentProvideFeedback,
    DocumentResponse,
    ProcessorRecordBase,
    ProcessorAssignment
)
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()

# -----------------
# DATA OWNER ENDPOINTS
# -----------------
@router.post("/owner", response_model=DocumentResponse)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
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
        owner_rec = OwnerRecord(ropa_doc_id=new_doc.id, **doc_in.owner_record.model_dump(exclude_unset=True))
        db.add(owner_rec)

    # 3. Hybrid Flexible Processors: Optionally blank processor records assigned directly to users
    if doc_in.processor_records:
        for pr_in in doc_in.processor_records:
            pr = ProcessorRecord(ropa_doc_id=new_doc.id, **pr_in.model_dump(exclude_unset=True))
            db.add(pr)

    db.commit()
    db.refresh(new_doc)
    return new_doc


@router.get("/dashboard/owner", response_model=List[DocumentResponse])
def get_owner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner", "Admin"]))
):
    if current_user.role == UserRoleEnum.ADMIN:
        return db.query(RopaDocument).filter(RopaDocument.owner_id.isnot(None)).all()
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
    
    if doc_in.title is not None:
        doc.title = doc_in.title

    if doc_in.owner_record:
        if not doc.owner_record:
            new_rec = OwnerRecord(ropa_doc_id=doc.id, **doc_in.owner_record.model_dump(exclude_unset=True))
            db.add(new_rec)
        else:
            for key, value in doc_in.owner_record.model_dump(exclude_unset=True).items():
                setattr(doc.owner_record, key, value)
            
    if doc_in.status is not None:
        doc.status = doc_in.status
        if doc.status == DocumentStatus.PENDING_AUDITOR:
            now = datetime.now(timezone.utc)
            doc.sent_to_auditor_at = now
            # อัพเดต received_at แยกต่อ form — เฉพาะ form ที่ยังไม่ approved
            audit = db.query(AuditorAudit).filter(AuditorAudit.ropa_doc_id == doc.id).first()
            if audit:
                if (audit.owner_review_status or 'pending_review') != 'approved':
                    audit.owner_received_at = now
                if (audit.processor_review_status or 'pending_review') != 'approved':
                    audit.processor_received_at = now

    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{doc_id}/owner/processors", response_model=DocumentResponse)
def owner_assign_processor(
    doc_id: UUID,
    assignment: ProcessorAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data Owner"]))
):
    """Hybrid Model Part 2: Owner spawns a new Processor blank form under their existing document."""
    doc = db.query(RopaDocument).filter(RopaDocument.id == doc_id, RopaDocument.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
        
    target_user = db.query(User).filter(User.id == assignment.assigned_to).first()
    if not target_user or target_user.role != UserRoleEnum.DATA_PROCESSOR:
        raise HTTPException(status_code=400, detail="Assigned user must exist and have the Data processor role")

    existing_rec = db.query(ProcessorRecord).filter(ProcessorRecord.ropa_doc_id == doc_id, ProcessorRecord.assigned_to == assignment.assigned_to).first()
    if existing_rec:
        raise HTTPException(status_code=400, detail="Processor Record already assigned to this user for this document.")

    new_pr = ProcessorRecord(
        ropa_doc_id=doc.id, 
        assigned_to=assignment.assigned_to,
        processor_name=assignment.processor_name
    )
    db.add(new_pr)
    db.commit()
    db.refresh(doc)
    return doc


# -----------------
# DATA PROCESSOR ENDPOINTS
# -----------------
@router.get("/dashboard/processor", response_model=List[DocumentResponse])
def get_processor_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Data processor", "Admin"]))
):
    if current_user.role == UserRoleEnum.ADMIN:
        return db.query(RopaDocument).join(ProcessorRecord).filter(ProcessorRecord.assigned_to.isnot(None)).all()
    # Find documents where this user is assigned as one of the processors
    return db.query(RopaDocument).join(ProcessorRecord).filter(ProcessorRecord.assigned_to == current_user.id).all()


@router.put("/{doc_id}/processor", response_model=DocumentResponse)
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
        for key, value in doc_in.processor_record.model_dump(exclude_unset=True).items():
            setattr(pr, key, value)
            
    if doc_in.status is not None:
        doc.status = doc_in.status
        if doc.status == DocumentStatus.PENDING_AUDITOR:
            now = datetime.now(timezone.utc)
            doc.sent_to_auditor_at = now
            # อัพเดต received_at แยกต่อ form — เฉพาะ form ที่ยังไม่ approved
            audit = db.query(AuditorAudit).filter(AuditorAudit.ropa_doc_id == doc.id).first()
            if audit:
                if (audit.owner_review_status or 'pending_review') != 'approved':
                    audit.owner_received_at = now
                if (audit.processor_review_status or 'pending_review') != 'approved':
                    audit.processor_received_at = now

    pr.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)
    return doc


# -----------------
# AUDITOR ENDPOINTS
# -----------------
@router.get("/dashboard/auditor", response_model=List[DocumentResponse])
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
        
    # Ensure AuditorProfile exists
    from app.models.document import AuditorProfile
    auditor_prof = db.query(AuditorProfile).filter(AuditorProfile.user_id == current_user.id).first()
    
    if not auditor_prof:
        # Create a stub profile for testing backwards compatibility if one wasn't properly initialized
        from app.models.document import AuditorType
        auditor_prof = AuditorProfile(user_id=current_user.id, auditor_type=AuditorType.INTERNAL, appointed_at=datetime.now(timezone.utc).date(), public_email=current_user.email)
        db.add(auditor_prof)
        db.flush()
        
    # ถ้าเอกสารถูกส่งให้ Auditor แล้ว (sent_to_auditor_at มีค่า) → set received_at ทั้งคู่
    _received = doc.sent_to_auditor_at or datetime.now(timezone.utc)
    audit_log = AuditorAudit(
        ropa_doc_id=doc.id,
        assigned_auditor_id=auditor_prof.id,
        status=doc_in.status or doc.status,
        feedback_comment=doc_in.feedback_comment,
        version=doc.version,
        owner_received_at=_received,
        processor_received_at=_received,
    )
    
    if doc_in.status == DocumentStatus.APPROVED:
        audit_log.approved_at = datetime.now(timezone.utc)
    elif doc_in.status in [DocumentStatus.REJECTED_OWNER, DocumentStatus.REJECTED_PROCESSOR]:
        audit_log.request_change_at = datetime.now(timezone.utc)
        doc.version += 1 # Auto bump version when bounced back
        
    db.add(audit_log)

    if doc_in.status is not None:
        doc.status = doc_in.status
        
    db.commit()
    db.refresh(doc)
    return doc
