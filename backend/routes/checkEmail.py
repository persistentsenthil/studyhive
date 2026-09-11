from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import uuid, hashlib
import jwt  # PyJWT


router = APIRouter()

class CheckEmailRequest(BaseModel):
    email: EmailStr

@router.post("/check-email")
async def check_email(request: Request, body: CheckEmailRequest):
    """Check if an email is already registered in the system."""
    db = request.app.mongodb
    user = await db.users.find_one({"email": body.email.lower()})
    return {"exists": user is not None}