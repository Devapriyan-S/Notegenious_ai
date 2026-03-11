from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    groq_api_key: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str
    groq_api_key: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SignupPendingResponse(BaseModel):
    message: str
    email: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

# Note models
class NoteCreate(BaseModel):
    title: Optional[str] = "Untitled Note"
    content: Optional[str] = ""
    color: Optional[str] = "default"
    tags: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None

class NoteLockRequest(BaseModel):
    password_hash: str   # SHA-256 hex hash (hashed on frontend)
    lock_hint: Optional[str] = ""

class NoteUnlockRequest(BaseModel):
    password_hash: str   # SHA-256 hex hash (hashed on frontend)

class NoteResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    is_locked: bool
    lock_hint: Optional[str]
    is_pinned: bool
    color: str
    tags: List[str]
    word_count: int
    created_at: datetime
    updated_at: datetime
