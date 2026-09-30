from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportGenerateRequest(BaseModel):
    prediction_id: Optional[int] = None
    case_id: Optional[int] = None
    title: Optional[str] = "Proactive Cyber-Fraud Intelligence & Withdrawal Hotspot Report"

class ReportOut(BaseModel):
    report_id: str
    generated_at: datetime
    title: str
    executive_summary: str
    risk_assessment: str
    predicted_hotspot: Dict[str, Any]
    predicted_time_window: str
    prediction_confidence: float
    transaction_analysis: Dict[str, Any]
    complaint_analysis: Dict[str, Any]
    related_entities: List[str]
    timeline: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
    related_cases: List[Dict[str, Any]]
    evidence_references: List[Dict[str, Any]]
    operational_recommendations: List[str]
    disclaimer: str
