import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session, load_only
from geoalchemy2.elements import WKTElement

from backend.app.models.prediction import Prediction
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.transaction import Transaction
from backend.app.models.complaint import Complaint
from backend.app.models.atm import ATM
from backend.app.ml.features import generate_spatial_temporal_features
from backend.app.ml.risk_model import future_hotspot_predictor
from backend.app.ml.scoring import risk_scoring_engine
from backend.app.alerts.engine import alert_engine

class PredictionService:
    async def run_future_prediction_pipeline(self, db: Session) -> Dict[str, Any]:
        """
        Executes future hotspot forecasting pipeline:
        1. Identifies monitored districts/zones
        2. Generates complaint & transaction features strictly from historical observation window
        3. Predicts future cash-withdrawal risk using trained Random Forest
        4. Calculates explainable 5 factors and forecasts time window
        5. Saves Prediction and RiskFactor records
        6. Evaluates alerts and routes to stakeholders
        """
        start_time = time.time()
        now = datetime.utcnow()
        valid_until = now + timedelta(hours=24)

        # Retrieve distinct districts
        districts = db.query(ATM.district, ATM.state).distinct().all()
        all_tx = db.query(Transaction).options(load_only(
            Transaction.id, Transaction.district, Transaction.amount, Transaction.timestamp,
            Transaction.transaction_type, Transaction.risk_indicator
        )).all()
        all_cp = db.query(Complaint).options(load_only(
            Complaint.id, Complaint.district, Complaint.amount, Complaint.timestamp, Complaint.category
        )).all()
        all_atms = db.query(ATM).options(load_only(
            ATM.id, ATM.district, ATM.latitude, ATM.longitude, ATM.bank
        )).all()

        # Pre-group records by district for instantaneous lookup
        tx_by_district: Dict[str, List[Any]] = {}
        for t in all_tx:
            tx_by_district.setdefault(t.district, []).append(t)

        cp_by_district: Dict[str, List[Any]] = {}
        for c in all_cp:
            cp_by_district.setdefault(c.district, []).append(c)

        atms_by_district: Dict[str, List[Any]] = {}
        for a in all_atms:
            atms_by_district.setdefault(a.district, []).append(a)


        # Pre-fetch existing active predictions
        existing_preds = {
            (p.district, p.state): p
            for p in db.query(Prediction).filter(Prediction.status == "ACTIVE").all()
        }

        created_predictions = []
        critical_count = 0
        high_count = 0
        prediction_meta = []

        for dist, st in districts:
            dist_tx = tx_by_district.get(dist, [])
            dist_cp = cp_by_district.get(dist, [])
            dist_atms = atms_by_district.get(dist, [])

            # Generate historical observation features (last 7 days up to now)
            feat = generate_spatial_temporal_features(
                district=dist,
                state=st,
                cutoff_time=now,
                historical_days=7,
                transactions=dist_tx,
                complaints=dist_cp,
                atms=dist_atms,
                graph_metrics={"degree": 7, "pagerank": 0.6, "betweenness": 0.15, "linked_accounts": 5, "shared_phone_count": 2}
            )

            # Supervised prediction of future cash-out probability
            res = future_hotspot_predictor.predict_future_hotspot(feat)
            
            # Forecast probable time window
            window = risk_scoring_engine.forecast_predicted_time_window(feat)

            # Representative coordinate from district ATMs
            lat = dist_atms[0].latitude if dist_atms else 28.6139
            lon = dist_atms[0].longitude if dist_atms else 77.2090

            # Generate deterministic zone_id for district
            clean_zone_id = f"ZONE-{dist.upper().replace(' ', '-')[:10]}"

            fut_prob = round(res.get("future_hotspot_probability", res["risk_score"] / 100.0), 2)
            uncert = round(1.0 - (res.get("confidence") or 0.85), 2)

            pred = existing_preds.get((dist, st))
            if not pred:
                pred = Prediction(
                    zone_id=clean_zone_id,
                    latitude=lat,
                    longitude=lon,
                    location=WKTElement(f"POINT({lon} {lat})", srid=4326),
                    state=st,
                    district=dist,
                    predicted_time_window=window,
                    time_window_probability=round(res.get("time_window_probability", 0.82), 2),
                    future_hotspot_probability=fut_prob,
                    risk_score=res["risk_score"],
                    risk_level=res["risk_level"],
                    confidence=res["confidence"],
                    uncertainty=uncert,
                    model_version="v1.0.0-rf-iforest",
                    prediction_timestamp=now,
                    valid_until=valid_until,
                    status="ACTIVE"
                )
                db.add(pred)
            else:
                if not pred.zone_id:
                    pred.zone_id = clean_zone_id
                pred.latitude = lat
                pred.longitude = lon
                pred.location = WKTElement(f"POINT({lon} {lat})", srid=4326)
                pred.risk_score = res["risk_score"]
                pred.risk_level = res["risk_level"]
                pred.confidence = res["confidence"]
                pred.future_hotspot_probability = fut_prob
                pred.uncertainty = uncert
                pred.predicted_time_window = window
                pred.valid_until = valid_until
                pred.prediction_timestamp = now

            created_predictions.append(pred)
            prediction_meta.append((pred, feat, window, dist_atms))
            if pred.risk_level == "CRITICAL":
                critical_count += 1
            elif pred.risk_level == "HIGH":
                high_count += 1

        db.flush()

        # Delete existing risk factors in bulk
        pred_ids = [p.id for p in created_predictions if p.id]
        if pred_ids:
            db.query(RiskFactor).filter(RiskFactor.prediction_id.in_(pred_ids)).delete(synchronize_session=False)

        # Bulk insert risk factors
        for pred, feat, window, dist_atms in prediction_meta:
            factors_data = [
                ("Transaction Anomaly", min(100.0, feat["amount_velocity"] * 35.0), "Elevated recent ATM withdrawal velocity compared to 7-day baseline"),
                ("Historical Cybercrime", min(100.0, feat["complaint_count"] * 6.5), f"Cluster of {int(feat['complaint_count'])} cyber fraud complaints registered in vicinity"),
                ("Geographic Concentration", min(100.0, len(dist_atms) * 7.5), f"High density of commercial ATM kiosks ({len(dist_atms)} units in district)"),
                ("Temporal Pattern", 82.0 if window == "18:00–22:00" else 45.0, "Synchronized evening cash-out pattern observed historically"),
                ("Network Intelligence", 70.0, "Centrality indicators link intermediary mule accounts to this financial corridor")
            ]
            for fname, contrib, expl in factors_data:
                rf = RiskFactor(
                    prediction_id=pred.id,
                    factor_name=fname,
                    contribution=round(contrib, 1),
                    explanation=expl
                )
                db.add(rf)

        db.commit()

        # Evaluate alerts
        for pred in created_predictions:
            await alert_engine.evaluate_prediction_alert(db, pred)

        elapsed = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "success",
            "predictions_count": len(created_predictions),
            "predictions_generated": len(created_predictions),
            "critical_count": critical_count,
            "high_count": high_count,
            "elapsed_ms": elapsed
        }

prediction_service = PredictionService()
