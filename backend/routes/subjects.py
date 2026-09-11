"""
Subjects Routes
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter()


class SubjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "📚"
    created_by: str = "anonymous"


@router.post("/")
async def create_subject(request: Request, body: SubjectCreate):
    db = request.app.mongodb
    existing = await db.subjects.find_one({"code": body.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject = {
        "_id": str(uuid.uuid4()),
        "name": body.name,
        "code": body.code.upper(),
        "description": body.description,
        "color": body.color,
        "icon": body.icon,
        "created_by": body.created_by,
        "created_at": datetime.utcnow(),
        "document_count": 0,
    }
    await db.subjects.insert_one(subject)
    subject["id"] = subject.pop("_id")
    return subject


@router.get("/")
async def list_subjects(request: Request):
    db = request.app.mongodb
    cursor = db.subjects.find().sort("name", 1)
    subjects = await cursor.to_list(length=100)

    # Enrich with document counts
    for s in subjects:
        s["id"] = str(s.pop("_id"))
        count = await db.documents.count_documents({"subject_id": s["id"]})
        s["document_count"] = count

    return {"subjects": subjects}


@router.get("/{subject_id}")
async def get_subject(request: Request, subject_id: str):
    db = request.app.mongodb
    subject = await db.subjects.find_one({"_id": subject_id})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject["id"] = str(subject.pop("_id"))
    count = await db.documents.count_documents({"subject_id": subject_id})
    subject["document_count"] = count
    return subject


# @router.delete("/{subject_id}")
# async def delete_subject(request: Request, subject_id: str):
#     db = request.app.mongodb
#     result = await db.subjects.delete_one({"_id": subject_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Subject not found")
#     return {"success": True, "subject_id": subject_id}
