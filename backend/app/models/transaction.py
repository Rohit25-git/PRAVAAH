from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from geoalchemy2 import Geography
from backend.app.database.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    account_id = Column(String(100), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False, index=True)  # ATM_WITHDRAWAL, UPI_TRANSFER, IMPS, POS
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location = Column(Geography(geometry_type="POINT", srid=4326, spatial_index=True), nullable=True)
    atm_id = Column(String(100), nullable=True, index=True)
    bank = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    device_id = Column(String(100), nullable=True, index=True)
    phone_id = Column(String(100), nullable=True, index=True)
    risk_indicator = Column(Float, default=0.0)  # 0 to 100 anomaly / risk score
    created_at = Column(DateTime, default=datetime.utcnow)
