from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from backend.app.database.session import get_db
from backend.app.schemas.graph import CytoscapeGraphResponse
from backend.app.graph.network_service import network_service

router = APIRouter(prefix="/graph", tags=["Graph Intelligence"])

@router.get("/cases", response_model=List[Dict[str, Any]])
def get_graph_cases(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Returns available cases with connected entity counts for case-wise investigation"""
    return network_service.get_available_cases(db, limit=limit)

@router.get("/case/{case_id}", response_model=CytoscapeGraphResponse)
def get_case_subgraph(
    case_id: str,
    db: Session = Depends(get_db)
):
    """Returns dedicated case-wise ego network for the specified case"""
    return network_service.get_case_subgraph(db, case_id=case_id)

@router.get("/all-risks", response_model=CytoscapeGraphResponse)
def get_all_risks_graph(
    risk_level: Optional[str] = Query(None, description="ALL, CRITICAL, HIGH, MEDIUM, LOW"),
    limit: int = Query(100, ge=10, le=250),
    db: Session = Depends(get_db)
):
    """Returns network graph for all risk hotspots or filtered by risk tier"""
    return network_service.get_all_risks_network(db, risk_level=risk_level, max_nodes=limit)

@router.get("/relationships", response_model=CytoscapeGraphResponse)
def get_relationships_graph(
    case_id: Optional[str] = None,
    focus_id: Optional[str] = None,
    limit: int = Query(60, ge=10, le=300),
    db: Session = Depends(get_db)
):
    return network_service.get_cytoscape_network(db, case_id=case_id, focus_entity_id=focus_id, max_nodes=limit)

@router.get("/entity/{id}", response_model=CytoscapeGraphResponse)
def get_entity_subgraph(id: str, db: Session = Depends(get_db)):
    return network_service.get_cytoscape_network(db, focus_entity_id=id, max_nodes=50)

