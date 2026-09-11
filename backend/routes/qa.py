"""
Q&A Routes - RAG-powered question answering
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from services.rag_service import rag_service

router = APIRouter()


class QuestionRequest(BaseModel):
    question: str
    subject_id: Optional[str] = None
    document_ids: Optional[List[str]] = None  # filter to specific docs
    session_id: Optional[str] = None
    user_id: str = "anonymous"


class QuestionResponse(BaseModel):
    session_id: str
    question: str
    answer: str
    sources: List[dict]
    confidence: float
    timestamp: str


@router.post("/ask", response_model=QuestionResponse)
async def ask_question(request: Request, body: QuestionRequest):
    """Ask a question and get RAG-powered answer"""
    db = request.app.mongodb

    session_id = body.session_id or str(uuid.uuid4())

    # Build chunk query
    chunk_query = {}
    if body.document_ids:
        chunk_query["document_id"] = {"$in": body.document_ids}
    elif body.subject_id:
        # Get all document IDs for this subject
        cursor = db.documents.find(
            {"subject_id": body.subject_id, "status": "ready"},
            {"_id": 1},
        )
        docs = await cursor.to_list(length=200)
        doc_ids = [d["_id"] for d in docs]
        if not doc_ids:
            return QuestionResponse(
                session_id=session_id,
                question=body.question,
                answer="No documents found for this subject. Please upload study materials first.",
                sources=[],
                confidence=0.0,
                timestamp=datetime.utcnow().isoformat(),
            )
        chunk_query["document_id"] = {"$in": doc_ids}

    # Fetch chunks (embeddings included for similarity search)
    cursor = db.chunks.find(chunk_query)
    chunks = await cursor.to_list(length=5000)

    # Get conversation history for this session
    history_cursor = (
        db.qa_sessions.find({"session_id": session_id})
        .sort("timestamp", 1)
        .limit(6)
    )
    history = await history_cursor.to_list(length=6)
    conversation_history = [
        {"role": h["role"], "content": h["content"]} for h in history
    ]

    # RAG: retrieve + generate
    result = await rag_service.answer_question(
        query=body.question,
        chunks_from_db=chunks,
        conversation_history=conversation_history,
    )

    timestamp = datetime.utcnow().isoformat()

    # Save Q&A to session
    await db.qa_sessions.insert_many([
        {
            "session_id": session_id,
            "user_id": body.user_id,
            "role": "user",
            "content": body.question,
            "timestamp": timestamp,
        },
        {
            "session_id": session_id,
            "user_id": body.user_id,
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
            "confidence": result["confidence"],
            "timestamp": timestamp,
        },
    ])

    return QuestionResponse(
        session_id=session_id,
        question=body.question,
        answer=result["answer"],
        sources=result["sources"],
        confidence=result["confidence"],
        timestamp=timestamp,
    )


@router.get("/sessions/{session_id}")
async def get_session_history(request: Request, session_id: str):
    """Get full conversation history for a session"""
    db = request.app.mongodb
    cursor = db.qa_sessions.find({"session_id": session_id}).sort("timestamp", 1)
    messages = await cursor.to_list(length=100)
    for m in messages:
        m["id"] = str(m.pop("_id"))
    return {"session_id": session_id, "messages": messages}


@router.get("/sessions")
async def list_sessions(request: Request, user_id: str = "anonymous", limit: int = 20):
    """List recent Q&A sessions for a user"""
    db = request.app.mongodb
    pipeline = [
        {"$match": {"user_id": user_id, "role": "user"}},
        {"$sort": {"timestamp": -1}},
        {"$limit": limit},
        {
            "$group": {
                "_id": "$session_id",
                "first_question": {"$first": "$content"},
                "timestamp": {"$first": "$timestamp"},
            }
        },
    ]
    cursor = db.qa_sessions.aggregate(pipeline)
    sessions = await cursor.to_list(length=limit)
    return {"sessions": sessions}


@router.delete("/sessions/{session_id}")
async def delete_session(request: Request, session_id: str):
    """Delete a Q&A session"""
    db = request.app.mongodb
    result = await db.qa_sessions.delete_many({"session_id": session_id})
    return {"success": True, "messages_deleted": result.deleted_count}
