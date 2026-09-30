from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ComplaintOut(BaseModel):
    id: int
    complaint_reference: str
    category: str
    amount: float
    timestamp: datetime
    latitude: float
    longitude: float
    district: str
    state: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintListResponse(BaseModel):
    items: List[ComplaintOut]
    total: int
