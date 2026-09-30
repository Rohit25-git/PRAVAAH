from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AIQueryRequest(BaseModel):
    query: str
    context_type: Optional[str] = None  # PREDICTION, CASE, GENERAL
    context_id: Optional[str] = None

class AIQueryResponse(BaseModel):
    answer: str
    model_used: str
    is_fallback: bool
    grounded_references: List[Dict[str, Any]]
    confidence_statement: str = "Analytical intelligence based strictly on synthetic demonstration records."

class AIExplainRiskRequest(BaseModel):
    prediction_id: Optional[int] = None
    district: Optional[str] = None

class AIExplainRiskResponse(BaseModel):
    prediction_id: int
    what: str
    where: str
    when: str
    why: str
    how_strong: str
    contributing_factors: Dict[str, float]
    supporting_complaints: List[Dict[str, Any]]
    supporting_transactions: List[Dict[str, Any]]
    what_next: List[str]
    disclaimer: str

class AISummarizeCaseRequest(BaseModel):
    case_id: int

class AISummarizeCaseResponse(BaseModel):
    case_reference: str
    summary: str
    timeline_summary: str
    related_entities: List[str]
    risk_explanation: str
    disclaimer: str
