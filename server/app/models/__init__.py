# Important: Import models in dependency order (Base -> Dependencies -> Dependents)
from app.models.enums import *

# 1. Base entities
from app.models.user import UserModel, UserSessionModel, PasswordResetTokenModel
from app.models.master_data import MstDepartmentModel, MstCompanyModel, MstRoleModel

# 2. Document entities
from app.models.document import (
    RopaDocumentModel,
    RopaRiskAssessmentModel,
    DocumentDeletionRequestModel,
    DocumentParticipantModel
)

# 3. Assignments (links user to doc)
from app.models.assignment import (
    AuditorAssignmentModel,
    ProcessorAssignmentModel
)

# 4. Workflow and Reviews
from app.models.workflow import (
    DocumentReviewCycleModel,
    ReviewAssignmentModel,
    ReviewFeedbackModel,
    ReviewDpoAssignmentModel
)

# 5. Sections
from app.models.section_owner import (
    RopaOwnerSectionModel,
    OwnerPersonalDataItemModel,
    OwnerDataCategoryModel,
    OwnerDataTypeModel,
    OwnerCollectionMethodModel,
    OwnerDataSourceModel,
    OwnerStorageTypeModel,
    OwnerStorageMethodModel,
    OwnerMinorConsentTypeModel
)
from app.models.section_processor import (
    RopaProcessorSectionModel,
    ProcessorPersonalDataItemModel,
    ProcessorDataCategoryModel,
    ProcessorDataTypeModel,
    ProcessorCollectionMethodModel,
    ProcessorDataSourceModel,
    ProcessorStorageTypeModel,
    ProcessorStorageMethodModel
)

# 6. Audits and Versions
from app.models.audit import AuditLogModel, DocumentVersionModel

# Export everything for Alembic mapping
__all__ = [
    "UserModel",
    "UserSessionModel",
    "PasswordResetTokenModel",
    "RopaDocumentModel",
    "RopaRiskAssessmentModel",
    "DocumentDeletionRequestModel",
    "DocumentParticipantModel",
    "AuditorAssignmentModel",
    "ProcessorAssignmentModel",
    "DocumentReviewCycleModel",
    "ReviewAssignmentModel",
    "ReviewFeedbackModel",
    "ReviewDpoAssignmentModel",
    "RopaOwnerSectionModel",
    "OwnerPersonalDataItemModel",
    "OwnerDataCategoryModel",
    "OwnerDataTypeModel",
    "OwnerCollectionMethodModel",
    "OwnerDataSourceModel",
    "OwnerStorageTypeModel",
    "OwnerStorageMethodModel",
    "OwnerMinorConsentTypeModel",
    "RopaProcessorSectionModel",
    "ProcessorPersonalDataItemModel",
    "ProcessorDataCategoryModel",
    "ProcessorDataTypeModel",
    "ProcessorCollectionMethodModel",
    "ProcessorDataSourceModel",
    "ProcessorStorageTypeModel",
    "ProcessorStorageMethodModel",
    "AuditLogModel",
    "DocumentVersionModel",
    "MstDepartmentModel",
    "MstCompanyModel",
    "MstRoleModel"
]
