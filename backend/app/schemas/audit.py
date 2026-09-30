from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogOut(BaseModel):
    id: int
    username: str
    role: str
    action: str
    resource: str
    ip_address: str
    result: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
