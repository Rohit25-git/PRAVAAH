from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InvestigationCreate(BaseModel):
    case_id: int
    investigator: str
    priority: str = "HIGH"
    notes: Optional[str] = None

class InvestigationUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None

class InvestigationOut(BaseModel):
    id: int
    case_id: int
    investigator: str
    status: str
    priority: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EvidenceCreate(BaseModel):
    case_id: int
    evidence_type: str
    description: str
    file_reference: str
    uploaded_by: str
    sha256_hash: Optional[str] = None

class EvidenceOut(BaseModel):
    id: int
    case_id: int
    evidence_type: str
    description: str
    file_reference: str
    uploaded_by: str
    timestamp: datetime
    sha256_hash: str
    integrity_status: str

    class Config:
        from_attributes = True
