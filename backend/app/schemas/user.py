from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    role: str  # I4C_OFFICER, LEA_OFFICER, BANK_ANALYST, ADMIN
    agency: Optional[str] = None
    jurisdiction: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class UserOut(UserBase):
    id: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str
    agency: Optional[str] = None
    jurisdiction: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
