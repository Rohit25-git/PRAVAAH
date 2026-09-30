from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from backend.app.database.session import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True, index=True)
    severity = Column(String(20), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    risk_score = Column(Float, nullable=False, index=True)
    location = Column(String(255), nullable=False)
    predicted_time_window = Column(String(50), nullable=False)
    status = Column(String(50), default="NEW", index=True)  # NEW, ACKNOWLEDGED, ASSIGNED, UNDER_INVESTIGATION, RESOLVED
    assigned_to = Column(String(100), nullable=True)
    agency = Column(String(150), default="State Cyber Crime Police")
    jurisdiction = Column(String(100), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
