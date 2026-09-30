from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from backend.app.database.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True, index=True)
    recipient_type = Column(String(50), nullable=False)  # I4C, LEA, BANK
    recipient = Column(String(100), nullable=False)
    channel = Column(String(50), default="WEBSOCKET")   # WEBSOCKET, EMAIL, SMS, SYSTEM
    status = Column(String(50), default="UNREAD", index=True)  # UNREAD, READ, DISMISSED
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
