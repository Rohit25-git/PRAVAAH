from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CaseCreate(BaseModel):
    category: str
    priority: str = "HIGH"
    jurisdiction: str
    assigned_agency: Optional[str] = "Cyber Crime Police Station"
    assigned_officer: Optional[str] = None

class CaseUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_officer: Optional[str] = None

class CaseOut(BaseModel):
    id: int
    case_reference: str
    category: str
    priority: str
    status: str
    jurisdiction: str
    assigned_agency: Optional[str] = None
    assigned_officer: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
