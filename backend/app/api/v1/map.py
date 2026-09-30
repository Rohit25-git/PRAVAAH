from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from geoalchemy2.functions import ST_DWithin, ST_Distance
from geoalchemy2.elements import WKTElement

from backend.app.database.session import get_db
from backend.app.models.prediction import Prediction
from backend.app.models.atm import ATM
from backend.app.models.transaction import Transaction
from backend.app.models.complaint import Complaint
from backend.app.schemas.atm import ATMOut
from backend.app.schemas.transaction import TransactionOut
from backend.app.schemas.complaint import ComplaintOut

router = APIRouter(prefix="/map", tags=["Map"])

@router.get("/risk-zones")
def get_map_risk_zones(db: Session = Depends(get_db)):
    """Returns predicted risk zones with coordinates and severity"""
    preds = db.query(Prediction).all()
    zones = []
    for p in preds:
        zones.append({
            "id": p.id,
            "district": p.district,
            "state": p.state,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "time_window": p.predicted_time_window,
            "confidence": p.confidence,
            "radius_meters": 1800 if p.risk_level == "CRITICAL" else 1200
        })
    return zones

@router.get("/atms", response_model=List[ATMOut])
def get_map_atms(
    district: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 250,
    db: Session = Depends(get_db)
):
    q = db.query(ATM)
    if district:
        q = q.filter(ATM.district == district)
    if state:
        q = q.filter(ATM.state == state)
    return q.limit(limit).all()

@router.get("/withdrawals", response_model=List[TransactionOut])
def get_map_withdrawals(
    suspicious_only: bool = True,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    q = db.query(Transaction).filter(Transaction.transaction_type == "ATM_WITHDRAWAL")
    if suspicious_only:
        q = q.filter(Transaction.risk_indicator >= 60.0)
    return q.order_by(Transaction.timestamp.desc()).limit(limit).all()

@router.get("/complaints", response_model=List[ComplaintOut])
def get_map_complaints(
    district: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    q = db.query(Complaint)
    if district:
        q = q.filter(Complaint.district == district)
    return q.order_by(Complaint.timestamp.desc()).limit(limit).all()

@router.get("/spatial-radius")
def get_spatial_radius_entities(
    latitude: float = Query(..., description="Center latitude in WGS84 (e.g. 28.6139)"),
    longitude: float = Query(..., description="Center longitude in WGS84 (e.g. 77.2090)"),
    radius_meters: float = Query(5000.0, description="Spatial search radius in meters"),
    db: Session = Depends(get_db)
):
    """
    PostGIS spatial radius search using ST_DWithin and GIST spatial index
    on GEOGRAPHY(POINT, 4326) entities.
    """
    point = WKTElement(f"POINT({longitude} {latitude})", srid=4326)

    nearby_atms = db.query(ATM).filter(
        ST_DWithin(ATM.location, point, radius_meters)
    ).limit(100).all()

    nearby_complaints = db.query(Complaint).filter(
        ST_DWithin(Complaint.location, point, radius_meters)
    ).limit(100).all()

    nearby_predictions = db.query(Prediction).filter(
        ST_DWithin(Prediction.location, point, radius_meters)
    ).limit(50).all()

    return {
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_meters": radius_meters,
        "spatial_engine": "PostgreSQL 18 + PostGIS 3.6 (GIST indexed)",
        "atms_count": len(nearby_atms),
        "atms": [
            {
                "id": a.id,
                "atm_reference": a.atm_reference,
                "bank": a.bank,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "district": a.district
            } for a in nearby_atms
        ],
        "complaints_count": len(nearby_complaints),
        "complaints": [
            {
                "id": c.id,
                "category": c.category,
                "amount": c.amount,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "district": c.district
            } for c in nearby_complaints
        ],
        "predictions_count": len(nearby_predictions),
        "predictions": [
            {
                "id": p.id,
                "zone_id": p.zone_id,
                "risk_score": p.risk_score,
                "risk_level": p.risk_level,
                "predicted_time_window": p.predicted_time_window
            } for p in nearby_predictions
        ]
    }
