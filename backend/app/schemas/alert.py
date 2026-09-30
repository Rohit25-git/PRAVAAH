from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertAcknowledge(BaseModel):
    assigned_to: Optional[str] = None

class AlertAssign(BaseModel):
    assigned_to: str
    agency: Optional[str] = None

class AlertResolve(BaseModel):
    resolution_notes: Optional[str] = None

class AlertOut(BaseModel):
    id: int
    prediction_id: Optional[int] = None
    severity: str
    risk_score: float
    location: str
    predicted_time_window: str
    status: str
    assigned_to: Optional[str] = None
    agency: Optional[str] = None
    jurisdiction: str
    reason: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
