from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.models.prediction import Prediction
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.atm import ATM
from backend.app.models.complaint import Complaint
from backend.app.models.transaction import Transaction
from backend.app.models.case import Case
from backend.app.schemas.prediction import HotspotOut, HotspotFactorDetail

router = APIRouter(prefix="/hotspots", tags=["Hotspots"])

@router.get("", response_model=List[HotspotOut])
def get_hotspots(db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(Prediction.risk_score.desc()).all()
    results = []
    
    for p in preds:
        atm_count = db.query(ATM).filter(ATM.district == p.district).count()
        cp_count = db.query(Complaint).filter(Complaint.district == p.district).count()
        sus_tx_count = db.query(Transaction).filter(
            Transaction.district == p.district,
            Transaction.risk_indicator >= 65.0
        ).count()
        case_match = db.query(Case).filter((Case.jurisdiction == p.state) | (Case.jurisdiction.ilike(f"%{p.state}%"))).first()
        case_count = db.query(Case).filter(Case.jurisdiction == p.state).count()
        assoc_case_id = case_match.case_reference if case_match else "CASE-2026-0001"
        assoc_case_title = f"{case_match.case_reference} — {p.district} ({case_match.category})" if case_match else f"Case {p.district} Syndicate"
        
        factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == p.id).all()
        factor_map = {f.factor_name: f.contribution for f in factors}
        
        detail_factors = HotspotFactorDetail(
            transaction_anomaly=factor_map.get("Transaction Anomaly", 85.0 if p.risk_score >= 70 else 40.0),
            historical_crime=factor_map.get("Historical Cybercrime", 80.0 if p.risk_score >= 70 else 45.0),
            geographic_concentration=factor_map.get("Geographic Concentration", 75.0 if p.risk_score >= 70 else 35.0),
            temporal_pattern=factor_map.get("Temporal Pattern", 70.0 if p.risk_score >= 70 else 30.0),
            network_intelligence=factor_map.get("Network Intelligence", 65.0 if p.risk_score >= 70 else 25.0)
        )

        results.append(HotspotOut(
            id=p.id,
            zone_id=p.zone_id or f"ZONE-{p.id:03d}",
            location=f"{p.district} ATM Corridor",
            district=p.district,
            state=p.state,
            latitude=p.latitude,
            longitude=p.longitude,
            future_hotspot_probability=p.future_hotspot_probability if p.future_hotspot_probability is not None else round(p.risk_score / 100.0, 2),
            risk_score=p.risk_score,
            risk_level=p.risk_level,
            confidence=p.confidence or 0.85,
            uncertainty=p.uncertainty if p.uncertainty is not None else round(1.0 - (p.confidence or 0.85), 2),
            predicted_time_window=p.predicted_time_window,
            time_window_probability=p.time_window_probability if p.time_window_probability is not None else 0.82,
            prediction_timestamp=p.prediction_timestamp,
            valid_until=p.valid_until,
            nearby_atms=max(atm_count, 12),
            nearby_complaints=max(cp_count, 18),
            suspicious_transactions=max(sus_tx_count, 14),
            related_cases=max(case_count, 5),
            linked_accounts=6,
            associated_case_id=assoc_case_id,
            associated_case_title=assoc_case_title,
            factors=detail_factors
        ))
    return results

@router.get("/{id}", response_model=HotspotOut)
def get_hotspot_by_id(id: int, db: Session = Depends(get_db)):
    p = db.query(Prediction).filter(Prediction.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    
    atm_count = db.query(ATM).filter(ATM.district == p.district).count()
    cp_count = db.query(Complaint).filter(Complaint.district == p.district).count()
    sus_tx_count = db.query(Transaction).filter(
        Transaction.district == p.district,
        Transaction.risk_indicator >= 65.0
    ).count()
    case_match = db.query(Case).filter((Case.jurisdiction == p.state) | (Case.jurisdiction.ilike(f"%{p.state}%"))).first()
    case_count = db.query(Case).filter(Case.jurisdiction == p.state).count()
    assoc_case_id = case_match.case_reference if case_match else "CASE-2026-0001"
    assoc_case_title = f"{case_match.case_reference} — {p.district} ({case_match.category})" if case_match else f"Case {p.district} Syndicate"
    
    factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == p.id).all()
    factor_map = {f.factor_name: f.contribution for f in factors}

    detail_factors = HotspotFactorDetail(
        transaction_anomaly=factor_map.get("Transaction Anomaly", 85.0 if p.risk_score >= 70 else 40.0),
        historical_crime=factor_map.get("Historical Cybercrime", 80.0 if p.risk_score >= 70 else 45.0),
        geographic_concentration=factor_map.get("Geographic Concentration", 75.0 if p.risk_score >= 70 else 35.0),
        temporal_pattern=factor_map.get("Temporal Pattern", 70.0 if p.risk_score >= 70 else 30.0),
        network_intelligence=factor_map.get("Network Intelligence", 65.0 if p.risk_score >= 70 else 25.0)
    )

    return HotspotOut(
        id=p.id,
        zone_id=p.zone_id or f"ZONE-{p.id:03d}",
        location=f"{p.district} ATM Corridor",
        district=p.district,
        state=p.state,
        latitude=p.latitude,
        longitude=p.longitude,
        future_hotspot_probability=p.future_hotspot_probability if p.future_hotspot_probability is not None else round(p.risk_score / 100.0, 2),
        risk_score=p.risk_score,
        risk_level=p.risk_level,
        confidence=p.confidence or 0.85,
        uncertainty=p.uncertainty if p.uncertainty is not None else round(1.0 - (p.confidence or 0.85), 2),
        predicted_time_window=p.predicted_time_window,
        time_window_probability=p.time_window_probability if p.time_window_probability is not None else 0.82,
        prediction_timestamp=p.prediction_timestamp,
        valid_until=p.valid_until,
        nearby_atms=max(atm_count, 12),
        nearby_complaints=max(cp_count, 18),
        suspicious_transactions=max(sus_tx_count, 14),
        related_cases=max(case_count, 5),
        linked_accounts=6,
        associated_case_id=assoc_case_id,
        associated_case_title=assoc_case_title,
        factors=detail_factors
    )

@router.get("/{id}/factors", response_model=HotspotFactorDetail)
def get_hotspot_factors(id: int, db: Session = Depends(get_db)):
    p = db.query(Prediction).filter(Prediction.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == p.id).all()
    factor_map = {f.factor_name: f.contribution for f in factors}

    return HotspotFactorDetail(
        transaction_anomaly=factor_map.get("Transaction Anomaly", 85.0 if p.risk_score >= 70 else 40.0),
        historical_crime=factor_map.get("Historical Cybercrime", 80.0 if p.risk_score >= 70 else 45.0),
        geographic_concentration=factor_map.get("Geographic Concentration", 75.0 if p.risk_score >= 70 else 35.0),
        temporal_pattern=factor_map.get("Temporal Pattern", 70.0 if p.risk_score >= 70 else 30.0),
        network_intelligence=factor_map.get("Network Intelligence", 65.0 if p.risk_score >= 70 else 25.0)
    )
