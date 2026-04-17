"""
rbac.py ─ Document-level RBAC engine for RoPa Web Service.

Access control is evaluated at the DATABASE QUERY level — each role
gets a different WHERE clause when fetching documents, preventing
horizontal privilege escalation.
"""

from enum import Enum
from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import or_, exists, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.user import UserRead


# ---------------------------------------------------------------------------
# Role constants — must match user_role_enum in PostgreSQL
# ---------------------------------------------------------------------------
class Role(str, Enum):
    OWNER = "OWNER"
    PROCESSOR = "PROCESSOR"
    DPO = "DPO"
    AUDITOR = "AUDITOR"
    ADMIN = "ADMIN"
    EXECUTIVE = "EXECUTIVE"


# ---------------------------------------------------------------------------
# Document Access Guard  ──  checks if current_user can access a document
# ---------------------------------------------------------------------------
def check_document_access(
    document_id: UUID,
    current_user: UserRead,
    db: Session,
) -> None:
    """
    Raise HTTP 403 if the current user has no access to document_id.
    """
    from app.models.document import RopaDocumentModel, DocumentParticipantModel
    from app.models.assignment import ProcessorAssignmentModel, AuditorAssignmentModel

    role = current_user.role
    user_id = current_user.id

    if role == Role.ADMIN:
        return

    doc = db.query(RopaDocumentModel).filter(
        RopaDocumentModel.id == document_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if role == Role.OWNER:
        has_access = (
            str(doc.created_by) == str(user_id)
            or db.query(ProcessorAssignmentModel).filter(
                ProcessorAssignmentModel.document_id == document_id,
                ProcessorAssignmentModel.assigned_by == user_id,
            ).first() is not None
        )
        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return

    if role == Role.PROCESSOR:
        has_access = db.query(ProcessorAssignmentModel).filter(
            ProcessorAssignmentModel.document_id == document_id,
            ProcessorAssignmentModel.processor_id == user_id,
        ).first() is not None
        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return

    if role == Role.DPO:
        in_participants = db.query(DocumentParticipantModel).filter(
            DocumentParticipantModel.document_id == document_id,
            DocumentParticipantModel.user_id == user_id,
        ).first() is not None
        if str(doc.created_by) != str(user_id) and not in_participants:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return

    if role == Role.AUDITOR:
        has_access = db.query(AuditorAssignmentModel).filter(
            AuditorAssignmentModel.document_id == document_id,
            AuditorAssignmentModel.auditor_id == user_id,
        ).first() is not None
        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return

    if role == Role.EXECUTIVE:
        in_participants = db.query(DocumentParticipantModel).filter(
            DocumentParticipantModel.document_id == document_id,
            DocumentParticipantModel.user_id == user_id,
        ).first() is not None
        if str(doc.created_by) != str(user_id) and not in_participants:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown role.")


# ---------------------------------------------------------------------------
# Document List Filter
# ---------------------------------------------------------------------------
def build_document_filter(current_user: UserRead, db: Session):
    from app.models.document import RopaDocumentModel, DocumentParticipantModel
    from app.models.assignment import ProcessorAssignmentModel, AuditorAssignmentModel

    user_id = current_user.id
    role = current_user.role

    if role == Role.ADMIN:
        return True

    if role == Role.OWNER:
        return or_(
            RopaDocumentModel.created_by == user_id,
            exists().where(
                and_(
                    ProcessorAssignmentModel.document_id == RopaDocumentModel.id,
                    ProcessorAssignmentModel.assigned_by == user_id,
                )
            ),
        )

    if role == Role.PROCESSOR:
        return exists().where(
            and_(
                ProcessorAssignmentModel.document_id == RopaDocumentModel.id,
                ProcessorAssignmentModel.processor_id == user_id,
            )
        )

    if role == Role.DPO:
        return or_(
            RopaDocumentModel.created_by == user_id,
            exists().where(
                and_(
                    DocumentParticipantModel.document_id == RopaDocumentModel.id,
                    DocumentParticipantModel.user_id == user_id,
                )
            ),
        )

    if role == Role.AUDITOR:
        return exists().where(
            and_(
                AuditorAssignmentModel.document_id == RopaDocumentModel.id,
                AuditorAssignmentModel.auditor_id == user_id,
            )
        )

    if role == Role.EXECUTIVE:
        return or_(
            RopaDocumentModel.created_by == user_id,
            exists().where(
                and_(
                    DocumentParticipantModel.document_id == RopaDocumentModel.id,
                    DocumentParticipantModel.user_id == user_id,
                )
            ),
        )

    return RopaDocumentModel.id == None


# ---------------------------------------------------------------------------
# Processor Section Guard
# ---------------------------------------------------------------------------
def check_processor_section_access(
    processor_section,
    current_user: UserRead,
) -> None:
    role = current_user.role

    if role in (Role.ADMIN, Role.OWNER, Role.AUDITOR, Role.DPO):
        return

    if role == Role.PROCESSOR:
        if str(processor_section.processor_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access another processor's section.",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Your role does not have access to processor sections.",
    )


# ---------------------------------------------------------------------------
# FastAPI Dependency Factories
# ---------------------------------------------------------------------------
def require_roles(*allowed_roles: Role) -> Callable:
    allowed = {r.value for r in allowed_roles}

    def dependency(current_user: UserRead = Depends(get_current_user)) -> UserRead:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {sorted(allowed)}",
            )
        return current_user

    return dependency


def require_document_access(
    document_id: UUID,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    check_document_access(document_id, current_user, db)
    return current_user
