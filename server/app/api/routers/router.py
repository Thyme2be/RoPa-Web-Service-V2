from fastapi import APIRouter

from app.api.routers import auth, documents, dashboard, admin, master_data

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
api_router.include_router(master_data.router)
