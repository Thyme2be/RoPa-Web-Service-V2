from fastapi import FastAPI
from pydantic import BaseModel

from app.api.routers import auth, users, documents, admin
from app.database import engine, Base

import app.models  # Import models to ensure they are registered with Base

# Create tables based on our models
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RoPa Web Service")

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(documents.router, prefix="/documents", tags=["Documents Workflow"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Controls"])
