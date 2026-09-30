from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AccountOut(BaseModel):
    id: int
    account_reference: str
    bank: str
    account_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ATMOut(BaseModel):
    id: int
    atm_reference: str
    bank: str
    latitude: float
    longitude: float
    district: str
    state: str
    location_type: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True
