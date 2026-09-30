from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.app.database.session import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_reference = Column(String(100), unique=True, index=True, nullable=False)
    bank = Column(String(100), nullable=False, index=True)
    account_type = Column(String(50), default="SAVINGS")
    status = Column(String(50), default="ACTIVE", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
