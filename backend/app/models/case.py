from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from backend.app.database.session import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_reference = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    priority = Column(String(20), default="HIGH", index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(50), default="OPEN", index=True)    # OPEN, UNDER_INVESTIGATION, ESCALATED, RESOLVED, CLOSED
    jurisdiction = Column(String(100), nullable=False, index=True)
    assigned_agency = Column(String(150), nullable=True)
    assigned_officer = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
