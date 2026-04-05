from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, users, documents, admin
from app.database import engine, Base
from app.core.config import settings


import app.models  # Import models to ensure they are registered with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables based on our models
    try:
        # This will be executed on startup
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Warning: Could not create database tables. Error: {e}")
        print("The application will continue to start, but database-dependent features may fail.")
    
    yield
    # This will be executed on shutdown (nothing needed for now)

app = FastAPI(title="RoPa Web Service", lifespan=lifespan)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(documents.router, prefix="/documents", tags=["Documents Workflow"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Controls"])
