from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardSummary(BaseModel):
    active_critical_alerts: int
    predicted_high_risk_zones: int
    suspicious_withdrawals: int
    cybercrime_complaints: int
    open_investigations: int
    open_cases: int
    total_cases: int = 520
    total_transactions: int = 10540
    total_atms: int = 572
    model_status: str

class ActivitySeries(BaseModel):
    timestamp: str
    complaints: int
    transactions: int
    withdrawals: int
    predicted_risk: float

class DashboardActivity(BaseModel):
    activity_timeline: List[ActivitySeries]
    category_distribution: List[Dict[str, Any]]
    time_window_distribution: List[Dict[str, Any]]
    geographic_distribution: List[Dict[str, Any]]
    model_performance: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    database: str
    ml_engine: str
    ollama_status: str
    graph_service: str
    version: str

class ModelStatusResponse(BaseModel):
    model_name: str
    model_version: str
    prediction_horizon: str
    training_dataset_size: int
    metrics: Dict[str, float]
    last_trained: str
    status: str
