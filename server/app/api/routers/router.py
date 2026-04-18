from fastapi import APIRouter

from app.api.routers import auth, documents, dashboard, admin, master_data, owner, processor, executive

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
api_router.include_router(master_data.router)
api_router.include_router(owner.router)
api_router.include_router(processor.router)
api_router.include_router(executive.router)
