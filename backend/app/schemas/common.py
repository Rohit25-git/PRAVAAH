from pydantic import BaseModel
from typing import List, Optional, Any

class HealthResponse(BaseModel):
    status: str
    database: str
    ml_engine: str
    graph_engine: str
    ai_engine: str
    ollama_status: str
    timestamp: str

class KPISummary(BaseModel):
    total_complaints: int
    complaints_trend: float
    active_hotspots: int
    hotspots_trend: float
    critical_alerts: int
    alerts_trend: float
    suspicious_transactions: int
    transactions_trend: float
    cases_under_investigation: int
    cases_trend: float
    predicted_high_risk_locations: int
    risk_locations_trend: float
