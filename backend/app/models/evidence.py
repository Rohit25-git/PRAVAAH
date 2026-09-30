from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from backend.app.database.session import Base

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False)  # CCTV_FOOTAGE, BANK_STATEMENT, CDR_LOG, ATM_JOURNAL, DEVICE_DUMP
    description = Column(Text, nullable=False)
    file_reference = Column(String(255), nullable=False)
    uploaded_by = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    sha256_hash = Column(String(64), nullable=False)  # Real cryptographic SHA-256
    integrity_status = Column(String(20), default="VERIFIED")  # VERIFIED, PENDING, FLAGGED
