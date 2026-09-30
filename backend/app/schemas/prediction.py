from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class RiskFactorOut(BaseModel):
    id: int
    prediction_id: int
    factor_name: str
    contribution: float
    explanation: str

    class Config:
        from_attributes = True

class PredictionOut(BaseModel):
    id: int
    zone_id: str
    latitude: float
    longitude: float
    state: str
    district: str
    predicted_time_window: str
    time_window_probability: float
    future_hotspot_probability: float
    risk_score: float
    risk_level: str
    confidence: float
    uncertainty: float
    model_version: str
    prediction_timestamp: datetime
    valid_until: datetime
    status: str
    risk_factors: Optional[List[RiskFactorOut]] = []

    class Config:
        from_attributes = True

class PredictionRunOut(BaseModel):
    id: int
    model_version: str
    training_data_version: str
    feature_version: str
    observation_window: str
    prediction_horizon: str
    started_at: datetime
    completed_at: datetime
    status: str
    records_scored: int
    zones_scored: int
    metrics_json: Optional[str] = None

    class Config:
        from_attributes = True

class HotspotFactorDetail(BaseModel):
    transaction_anomaly: float
    historical_crime: float
    geographic_concentration: float
    temporal_pattern: float
    network_intelligence: float
    disclaimer: str = "Analytical indicator based on synthetic demonstration data. Does not establish criminal certainty."

class HotspotOut(BaseModel):
    id: int
    zone_id: str
    location: str
    district: str
    state: str
    latitude: float
    longitude: float
    future_hotspot_probability: float
    risk_score: float
    risk_level: str
    confidence: float
    uncertainty: float
    predicted_time_window: str
    time_window_probability: float
    prediction_timestamp: datetime
    valid_until: datetime
    nearby_atms: int = 0
    nearby_complaints: int = 0
    suspicious_transactions: int = 0
    related_cases: int = 0
    linked_accounts: int = 0
    associated_case_id: Optional[str] = None
    associated_case_title: Optional[str] = None
    factors: Optional[HotspotFactorDetail] = None

    class Config:
        from_attributes = True
