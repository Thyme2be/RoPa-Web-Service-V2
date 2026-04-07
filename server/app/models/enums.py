import enum

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class AuditAction(enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
