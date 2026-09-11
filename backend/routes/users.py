"""
Users Routes - Extended Authentication & User Management
"""
from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import uuid, hashlib
import jwt  # PyJWT

router = APIRouter()

SECRET_KEY = "YOUR_PRODUCTION_SECRET_KEY_HERE" # Store in .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str  # e.g., "Student", "Educator", "Researcher"
    institution: str  # e.g., "Stanford University"
    department: Optional[str] = ""
    avatar_color: Optional[str] = "#6366f1"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    db = request.app.mongodb
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["id"] = str(user.pop("_id"))
    user.pop("password_hash", None)
    return user

@router.post("/register")
async def register(request: Request, body: UserRegister):
    db = request.app.mongodb
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "name": body.name,
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "role": body.role,
        "institution": body.institution,
        "department": body.department,
        "avatar_color": body.avatar_color,
        "joined_at": datetime.utcnow(),
    }
    await db.users.insert_one(user)
    
    token = create_access_token({"sub": user_id, "email": user["email"]})
    user["id"] = user.pop("_id")
    user.pop("password_hash")
    return {"access_token": token, "token_type": "bearer", "user": user}

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: Request, body: UserLogin):
    db = request.app.mongodb
    user = await db.users.find_one({"email": body.email.lower()})
    
    if not user or user["password_hash"] != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "email": user["email"]})
    user["id"] = str(user.pop("_id"))
    user.pop("password_hash", None)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user