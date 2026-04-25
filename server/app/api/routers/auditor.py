from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.core.rbac import Role, require_roles
from app.models.assignment import AuditorAssignmentModel
from app.models.document import RopaDocumentModel
from app.schemas.user import UserRead
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/auditor")

@router.patch("/assignments/{assignment_id}/verify", summary="Auditor: Verify Assignment", tags=["Auditor"])
def verify_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(require_roles(Role.AUDITOR, Role.ADMIN))
):
    """
    Mark an auditor assignment as VERIFIED.
    """
    assignment = db.query(AuditorAssignmentModel).filter(AuditorAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Access control: only the assigned auditor or admin
    if current_user.role != Role.ADMIN and assignment.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to verify this assignment.")

    assignment.status = 'VERIFIED'
    
    # Update Document Status to COMPLETED
    document = db.query(RopaDocumentModel).filter(RopaDocumentModel.id == assignment.document_id).first()
    if document:
        document.status = 'COMPLETED'
        now = datetime.now(timezone.utc)
        document.last_approved_at = now
        # Set next review due date (1 year by default)
        document.next_review_due_at = now + timedelta(days=document.review_interval_days or 365)
        
        # Transform document_number prefix from DFT- to RP-
        if document.document_number and document.document_number.startswith("DFT-"):
            document.document_number = document.document_number.replace("DFT-", "RP-", 1)
            
        db.add(document)

    db.add(assignment)
    db.commit()

    return {"message": "Assignment verified and document completed.", "status": "VERIFIED"}
