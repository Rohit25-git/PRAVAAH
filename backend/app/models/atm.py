from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from geoalchemy2 import Geography
from backend.app.database.session import Base

class ATM(Base):
    __tablename__ = "atms"

    id = Column(Integer, primary_key=True, index=True)
    atm_reference = Column(String(100), unique=True, index=True, nullable=False)
    bank = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location = Column(Geography(geometry_type="POINT", srid=4326, spatial_index=True), nullable=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    location_type = Column(String(100), default="STANDALONE_KIOSK")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
