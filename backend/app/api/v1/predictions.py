from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.session import get_db
from backend.app.models.prediction import Prediction
from backend.app.models.risk_factor import RiskFactor
from backend.app.schemas.prediction import PredictionOut, RiskFactorOut
from backend.app.services.prediction_service import prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("/run")
async def run_predictions(db: Session = Depends(get_db)):
    """Runs the full predictive pipeline over current records"""
    try:
        result = await prediction_service.run_future_prediction_pipeline(db)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction pipeline error: {str(e)}")

@router.get("", response_model=List[PredictionOut])
def get_predictions(db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(Prediction.risk_score.desc()).all()
    results = []
    for p in preds:
        factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == p.id).all()
        results.append(PredictionOut(
            id=p.id,
            zone_id=p.zone_id or f"ZONE-{p.id:03d}",
            latitude=p.latitude,
            longitude=p.longitude,
            state=p.state,
            district=p.district,
            predicted_time_window=p.predicted_time_window,
            time_window_probability=p.time_window_probability if p.time_window_probability is not None else 0.82,
            future_hotspot_probability=p.future_hotspot_probability if p.future_hotspot_probability is not None else round(p.risk_score / 100.0, 2),
            risk_score=p.risk_score,
            risk_level=p.risk_level,
            confidence=p.confidence or 0.85,
            uncertainty=p.uncertainty if p.uncertainty is not None else round(1.0 - (p.confidence or 0.85), 2),
            model_version=p.model_version or "v1.4-rf-supervised",
            prediction_timestamp=p.prediction_timestamp,
            valid_until=p.valid_until,
            status=p.status or "ACTIVE",
            risk_factors=[RiskFactorOut.from_orm(f) for f in factors]
        ))
    return results

@router.get("/{id}", response_model=PredictionOut)
def get_prediction_by_id(id: int, db: Session = Depends(get_db)):
    p = db.query(Prediction).filter(Prediction.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prediction not found")
    factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == p.id).all()
    return PredictionOut(
        id=p.id,
        zone_id=p.zone_id or f"ZONE-{p.id:03d}",
        latitude=p.latitude,
        longitude=p.longitude,
        state=p.state,
        district=p.district,
        predicted_time_window=p.predicted_time_window,
        time_window_probability=p.time_window_probability if p.time_window_probability is not None else 0.82,
        future_hotspot_probability=p.future_hotspot_probability if p.future_hotspot_probability is not None else round(p.risk_score / 100.0, 2),
        risk_score=p.risk_score,
        risk_level=p.risk_level,
        confidence=p.confidence or 0.85,
        uncertainty=p.uncertainty if p.uncertainty is not None else round(1.0 - (p.confidence or 0.85), 2),
        model_version=p.model_version or "v1.4-rf-supervised",
        prediction_timestamp=p.prediction_timestamp,
        valid_until=p.valid_until,
        status=p.status or "ACTIVE",
        risk_factors=[RiskFactorOut.from_orm(f) for f in factors]
    )
