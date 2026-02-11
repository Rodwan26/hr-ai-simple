from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Resolve forward references for Pydantic V2
UserResponse.model_rebuild()
Token.model_rebuild()
