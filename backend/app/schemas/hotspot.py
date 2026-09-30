from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class HotspotFactors(BaseModel):
    transaction_anomaly: float
    complaint_concentration: float
    geographic_clustering: float
    temporal_pattern: float
    graph_connectivity: float
    disclaimer: str = "Risk factors are model-generated indicators based on synthetic demonstration data."

class HotspotBase(BaseModel):
    zone_id: str
    zone_name: str
    state: str
    district: str
    city: str
    latitude: float
    longitude: float
    radius_meters: float
    risk_score: float
    risk_level: str
    predicted_time_window: str
    related_complaints: int
    suspicious_transactions: int
    nearby_atms: int
    linked_accounts: int

class HotspotOut(HotspotBase):
    id: int
    factor_transaction_anomaly: float
    factor_complaint_concentration: float
    factor_geo_clustering: float
    factor_temporal_pattern: float
    factor_graph_connectivity: float
    window_risks: Optional[Dict[str, float]] = None
    cluster_id: int
    is_active: int
    last_updated: datetime

    class Config:
        from_attributes = True

class HotspotDetail(HotspotOut):
    factors: HotspotFactors
    what: str
    why: str
    when: str
    where: str
    how_strong: str

class PredictionRunOut(BaseModel):
    id: int
    run_timestamp: datetime
    model_version: str
    hotspots_identified: int
    critical_zones: int
    high_zones: int
    medium_zones: int
    low_zones: int
    average_risk: float
    execution_time_ms: float
    summary_notes: Optional[str] = None

    class Config:
        from_attributes = True
