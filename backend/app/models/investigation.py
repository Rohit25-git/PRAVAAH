from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from backend.app.database.session import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    investigator = Column(String(100), nullable=False)
    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE, PAUSED, CONCLUDED
    priority = Column(String(20), default="HIGH")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
