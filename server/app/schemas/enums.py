from enum import Enum

class UserStatusEnum(str, Enum):
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'

class AssignmentStatusEnum(str, Enum):
    IN_PROGRESS = 'IN_PROGRESS'
    SUBMITTED = 'SUBMITTED'
    OVERDUE = 'OVERDUE'

class AuditorAssignmentStatusEnum(str, Enum):
    IN_REVIEW = 'IN_REVIEW'
    VERIFIED = 'VERIFIED'
    OVERDUE = 'OVERDUE'

class RiskLevelEnum(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'

class UserRoleEnum(str, Enum):
    OWNER = 'OWNER'
    PROCESSOR = 'PROCESSOR'
    DPO = 'DPO'
    AUDITOR = 'AUDITOR'
    ADMIN = 'ADMIN'
    EXECUTIVE = 'EXECUTIVE'
    NONE = 'NONE'

class DocumentStatusEnum(str, Enum):
    IN_PROGRESS = 'IN_PROGRESS'
    UNDER_REVIEW = 'UNDER_REVIEW'
    COMPLETED = 'COMPLETED'
    EXPIRED = 'EXPIRED'

class DeletionStatusEnum(str, Enum):
    DELETE_PENDING = 'DELETE_PENDING'
    DELETED = 'DELETED'

class ReviewStatusEnum(str, Enum):
    IN_REVIEW = 'IN_REVIEW'
    CHANGES_REQUESTED = 'CHANGES_REQUESTED'
    APPROVED = 'APPROVED'
    CANCELLED = 'CANCELLED'

class DeletionRequestStatusEnum(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    CANCELLED = 'CANCELLED'

class DecisionEnum(str, Enum):
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class ReviewAssignmentStatusEnum(str, Enum):
    FIX_IN_PROGRESS = 'FIX_IN_PROGRESS'
    FIX_SUBMITTED = 'FIX_SUBMITTED'
    COMPLETED = 'COMPLETED'

class ReviewAssignmentRoleEnum(str, Enum):
    OWNER = 'OWNER'
    PROCESSOR = 'PROCESSOR'

class FeedbackStatusEnum(str, Enum):
    OPEN = 'OPEN'
    RESOLVED = 'RESOLVED'

class FeedbackTargetEnum(str, Enum):
    OWNER_SECTION = 'OWNER_SECTION'
    PROCESSOR_SECTION = 'PROCESSOR_SECTION'
    RISK_ASSESSMENT = 'RISK_ASSESSMENT'

class RopaSectionEnum(str, Enum):
    DRAFT = 'DRAFT'
    SUBMITTED = 'SUBMITTED'

class DocumentParticipantRoleEnum(str, Enum):
    OWNER = 'OWNER'
    EDITOR = 'EDITOR'
    VIEWER = 'VIEWER'

class AuditorTypeEnum(str, Enum):
    INTERNAL = 'INTERNAL'
    EXTERNAL = 'EXTERNAL'
