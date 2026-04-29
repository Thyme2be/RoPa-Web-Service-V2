from sqlalchemy.dialects.postgresql import ENUM

# Define Python references to the precisely created PostgreSQL ENUMs.
# Must use create_type=False because we rely on the migration to create them.

user_status_enum = ENUM(
    'ACTIVE', 'INACTIVE',
    name='user_status_enum',
    create_type=False
)

assignment_status_enum = ENUM(
    'IN_PROGRESS', 'SUBMITTED', 'OVERDUE',
    name='assignment_status_enum',
    create_type=False
)

auditor_assignment_status_enum = ENUM(
    'IN_REVIEW', 'VERIFIED', 'OVERDUE',
    name='auditor_assignment_status_enum',
    create_type=False
)

risk_level_enum = ENUM(
    'LOW', 'MEDIUM', 'HIGH',
    name='risk_level_enum',
    create_type=False
)

user_role_enum = ENUM(
    'OWNER', 'PROCESSOR', 'DPO', 'AUDITOR', 'ADMIN', 'EXECUTIVE',
    name='user_role_enum',
    create_type=False
)

document_status_enum = ENUM(
    'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'EXPIRED',
    name='document_status_enum',
    create_type=False
)

deletion_status_enum = ENUM(
    'DELETE_PENDING', 'DELETED',
    name='deletion_status_enum',
    create_type=False
)

review_status_enum = ENUM(
    'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'CANCELLED',
    name='review_status_enum',
    create_type=False
)

deletion_request_status_enum = ENUM(
    'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED',
    name='deletion_request_status_enum',
    create_type=False
)

decision_enum = ENUM(
    'APPROVED', 'REJECTED',
    name='decision_enum',
    create_type=False
)

review_assignment_status_enum = ENUM(
    'FIX_IN_PROGRESS', 'FIX_SUBMITTED', 'COMPLETED',
    name='review_assignment_status_enum',
    create_type=False
)

review_assignment_role_enum = ENUM(
    'OWNER', 'PROCESSOR',
    name='review_assignment_role_enum',
    create_type=False
)

feedback_status_enum = ENUM(
    'OPEN', 'RESOLVED',
    name='feedback_status_enum',
    create_type=False
)

feedback_target_enum = ENUM(
    'OWNER_SECTION', 'PROCESSOR_SECTION', 'RISK_ASSESSMENT',
    name='feedback_target_enum',
    create_type=False
)

ropa_section = ENUM(
    'DRAFT', 'SUBMITTED',
    name='ropa_section',
    create_type=False
)

document_participant_role_enum = ENUM(
    'OWNER', 'EDITOR', 'VIEWER',
    name='document_participant_role_enum',
    create_type=False
)

auditor_type_enum = ENUM(
    'INTERNAL', 'EXTERNAL',
    name='auditor_type_enum',
    create_type=False
)
