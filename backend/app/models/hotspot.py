from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime
from backend.app.database import Base

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String(50), unique=True, index=True, nullable=False)
    zone_name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=1500.0)
    
    risk_score = Column(Float, nullable=False, index=True)  # 0 to 100
    risk_level = Column(String(20), nullable=False)         # LOW, MEDIUM, HIGH, CRITICAL
    predicted_time_window = Column(String(50), default="18:00 - 22:00")
    
    related_complaints = Column(Integer, default=0)
    suspicious_transactions = Column(Integer, default=0)
    nearby_atms = Column(Integer, default=0)
    linked_accounts = Column(Integer, default=0)
    
    # Feature contributions for Explainable AI (0 - 100)
    factor_transaction_anomaly = Column(Float, default=0.0)
    factor_complaint_concentration = Column(Float, default=0.0)
    factor_geo_clustering = Column(Float, default=0.0)
    factor_temporal_pattern = Column(Float, default=0.0)
    factor_graph_connectivity = Column(Float, default=0.0)
    
    # Additional metadata / time window probabilities
    window_risks = Column(JSON, nullable=True)  # {"00-06": 20, "06-12": 35, "12-18": 60, "18-22": 88, "22-00": 45}
    
    cluster_id = Column(Integer, default=-1)
    is_active = Column(Integer, default=1)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
