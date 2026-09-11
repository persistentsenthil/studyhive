"""
StudyHive Backend - FastAPI + MongoDB + RAG
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

from routes.documents import router as documents_router
from routes.qa import router as qa_router
from routes.users import router as users_router
from routes.subjects import router as subjects_router
from routes.checkEmail import router as email_router

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "studyhive")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    app.mongodb = app.mongodb_client[DB_NAME]
    print("✅ Connected to MongoDB")

    # Create indexes
    await app.mongodb.documents.create_index("subject_id")
    await app.mongodb.documents.create_index("uploaded_by")
    await app.mongodb.chunks.create_index("document_id")
    await app.mongodb.qa_sessions.create_index("user_id")

    yield

    # Shutdown
    app.mongodb_client.close()
    print("❌ Disconnected from MongoDB")


app = FastAPI(
    title="StudyHive API",
    description="Collaborative Study Platform with RAG-powered Q&A",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(email_router, prefix="/api/checkEmail", tags=["checkEmail"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(qa_router, prefix="/api/qa", tags=["Q&A"])
app.include_router(subjects_router, prefix="/api/subjects", tags=["Subjects"])


@app.get("/")
async def root():
    return {"message": "StudyHive API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
