from pydantic import BaseModel
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
