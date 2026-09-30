from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from backend.app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, LOGOUT, VIEW_CASE, ACKNOWLEDGE_ALERT, GENERATE_REPORT, RUN_PREDICTION, SIMULATION
    resource = Column(String(255), nullable=False)
    ip_address = Column(String(50), default="127.0.0.1")
    result = Column(String(20), default="SUCCESS")  # SUCCESS, FAILURE, DENIED
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
