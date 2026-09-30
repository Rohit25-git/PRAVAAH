from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from geoalchemy2 import Geography
from backend.app.database.session import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    location = Column(Geography(geometry_type="POINT", srid=4326, spatial_index=True), nullable=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    predicted_time_window = Column(String(50), nullable=False)  # 00:00–06:00, 06:00–12:00, 12:00–18:00, 18:00–22:00, 22:00–00:00
    time_window_probability = Column(Float, default=0.75)       # 0.0 to 1.0
    future_hotspot_probability = Column(Float, default=0.65)    # ML estimated probability 0.0 to 1.0
    risk_score = Column(Float, nullable=False, index=True)      # 0 to 100
    risk_level = Column(String(20), nullable=False, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85)                    # 0.0 to 1.0
    uncertainty = Column(Float, default=0.15)                   # 1.0 - confidence
    model_version = Column(String(50), default="v1.4-rf-supervised")
    prediction_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    valid_until = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACTIVE", index=True)
