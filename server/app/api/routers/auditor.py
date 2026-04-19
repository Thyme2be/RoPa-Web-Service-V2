from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.core.rbac import Role, require_roles
from app.models.assignment import AuditorAssignmentModel
from app.schemas.user import UserRead

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
    db.add(assignment)
    db.commit()

    return {"message": "Assignment verified successfully.", "status": "VERIFIED"}
