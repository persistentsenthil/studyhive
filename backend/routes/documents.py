"""
Documents Routes - Upload, retrieve, delete study materials
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request ,Depends
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid

from services.rag_service import rag_service

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def doc_to_dict(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: str = Form("general"),
    description: str = Form(""),
    tags: str = Form(""),  # comma-separated
    uploaded_by: str = Form("anonymous"),
):
    """Upload and process a study document, saving metadata and parsed chunks to MongoDB."""
    db = request.app.mongodb

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="File type not supported. Allowed: PDF, DOCX, TXT",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 20MB.")

    document_id = str(uuid.uuid4())
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    # Save initial document metadata with processing status
    doc_data = {
        "_id": document_id,
        "title": title,
        "subject_id": subject_id,
        "description": description,
        "tags": tag_list,
        "filename": file.filename,
        "file_type": ALLOWED_TYPES[file.content_type],
        "file_size": len(file_bytes),
        "uploaded_by": uploaded_by,
        "uploaded_at": datetime.utcnow(),
        "chunk_count": 0,
        "status": "processing",
    }
    
    # Insert entry so it's instantly trackable in MongoDB
    await db.documents.insert_one(doc_data)

    try:
        # Process document chunks & embeddings via RAG service
        chunks = await rag_service.process_document(
            file_bytes=file_bytes,
            filename=file.filename,
            document_id=document_id,
            document_title=title,
        )

        if chunks:
            await db.chunks.insert_many(chunks)

        # Update final document status to ready
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"chunk_count": len(chunks), "status": "ready"}},
        )

        return {
            "success": True,
            "document_id": document_id,
            "title": title,
            "chunks_created": len(chunks),
            "status": "ready",
        }

    except Exception as e:
        # Mark document status as error if processing crashes
        await db.documents.update_one(
            {"_id": document_id},
            {"$set": {"status": "error", "error": str(e)}},
        )
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/")
async def list_documents(
    request: Request,
    subject_id: str = None,
    limit: int = 50,
    skip: int = 0,
):
    """List all documents, optionally filtered by subject"""
    db = request.app.mongodb
    query = {}
    if subject_id:
        query["subject_id"] = subject_id

    cursor = db.documents.find(query).skip(skip).limit(limit).sort("uploaded_at", -1)
    docs = await cursor.to_list(length=limit)

    return {"documents": [doc_to_dict(d) for d in docs], "total": len(docs)}


@router.get("/{document_id}")
async def get_document(request: Request, document_id: str):
    """Get a single document by ID"""
    db = request.app.mongodb
    doc = await db.documents.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc_to_dict(doc)


from routes.users import get_current_user

@router.delete("/{document_id}")
async def delete_document(
    request: Request, 
    document_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Delete a document and its chunks — Only allowed for the uploader."""
    db = request.app.mongodb
    doc = await db.documents.find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Verify document ownership
    if doc.get("uploaded_by") != current_user["id"]:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: You can only delete documents uploaded by you."
        )

    await db.documents.delete_one({"_id": document_id})
    deleted_chunks = await db.chunks.delete_many({"document_id": document_id})

    return {
        "success": True,
        "document_id": document_id,
        "chunks_deleted": deleted_chunks.deleted_count,
    }


@router.get("/{document_id}/chunks")
async def get_document_chunks(request: Request, document_id: str):
    """Get all chunks for a document (excluding heavy vectors for debugging)"""
    db = request.app.mongodb
    cursor = db.chunks.find(
        {"document_id": document_id}, {"embedding": 0}
    ).sort("chunk_index", 1)
    
    chunks = await cursor.to_list(length=500)
    for c in chunks:
        if "_id" in c:
            c["id"] = str(c.pop("_id"))
            
    return {"chunks": chunks, "count": len(chunks)}