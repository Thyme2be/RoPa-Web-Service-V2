from app.api.routers import auth, documents, dashboard, admin
from app.api.routers.router import api_router

__all__ = ["api_router", "auth", "documents", "dashboard", "admin"]
