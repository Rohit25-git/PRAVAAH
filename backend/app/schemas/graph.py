from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    type: str  # PERSON, ACCOUNT, PHONE, DEVICE, ATM, LOCATION, CASE, TRANSACTION
    risk: float = 0.0
    risk_level: str = "LOW"
    details: Dict[str, Any] = {}

class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData

class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    weight: float = 1.0

class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData

class CytoscapeGraphResponse(BaseModel):
    elements: Dict[str, List[Any]]  # {"nodes": [...], "edges": [...]}
    metrics: Dict[str, Any]         # PageRank, degrees, high-risk entities
    nodes: Optional[List[Any]] = None
    edges: Optional[List[Any]] = None
