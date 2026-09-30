from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime
from backend.app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, LOGOUT, PREDICTION_RUN, ALERT_ACKNOWLEDGE, ALERT_ASSIGN, SIMULATION_START, CASE_CREATE, REPORT_GENERATE
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    metadata_json = Column(Text, nullable=True)  # JSON-encoded metadata
