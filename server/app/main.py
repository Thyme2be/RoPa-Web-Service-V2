from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, users, admin
from app.api.routers.documents import owner_router, processor_docs_router, auditor_docs_router
from app.api.routers.processor import router as processor_router
from app.database import engine, Base
from app.core.config import settings

import app.models  # Import models to ensure they are registered with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Warning: Could not create database tables. Error: {e}")
        print("The application will continue to start, but database-dependent features may fail.")

    yield

app = FastAPI(title="RoPa Web Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(owner_router, prefix="/owner", tags=["Data Owner"])
app.include_router(processor_docs_router, prefix="/processor", tags=["Data Processor"])
app.include_router(auditor_docs_router, prefix="/auditor", tags=["Auditor"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Controls"])
app.include_router(processor_router, prefix="/processor", tags=["Data Processor"])
