from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TransactionOut(BaseModel):
    id: int
    transaction_reference: str
    account_id: str
    transaction_type: str
    amount: float
    timestamp: datetime
    latitude: float
    longitude: float
    atm_id: Optional[str] = None
    bank: str
    district: str
    state: str
    device_id: Optional[str] = None
    phone_id: Optional[str] = None
    risk_indicator: float
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    limit: int
