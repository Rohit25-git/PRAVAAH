import time
import numpy as np
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models.transaction import Transaction
from backend.app.models.complaint import Complaint
from backend.app.models.atm import ATM
from backend.app.models.hotspot import Hotspot
from backend.app.models.prediction import PredictionRun
from backend.app.ml.features import extract_transaction_features, calculate_zone_features
from backend.app.ml.anomaly_model import anomaly_detector
from backend.app.ml.geo_model import geo_cluster_engine
from backend.app.ml.risk_model import risk_model
from backend.app.ml.scoring import risk_scorer

class PredictionService:
    def run_prediction_pipeline(self, db: Session) -> Dict[str, Any]:
        """
        Executes the end-to-end analytical prediction pipeline:
        1. Queries recent transactions, complaints, ATMs
        2. Scores transactions using Isolation Forest
        3. Identifies spatial clusters via DBSCAN
        4. Calculates 5-factor risk scores and temporal window forecasts
        5. Updates Hotspot entities and registers PredictionRun audit
        """
        start_time = time.time()

        # 1. Fetch data
        transactions = db.query(Transaction).all()
        complaints = db.query(Complaint).all()
        atms = db.query(ATM).all()
        hotspots = db.query(Hotspot).all()

        # 2. Score transactions using Isolation Forest
        if transactions:
            tx_records = [{
                "id": t.id,
                "amount": t.amount,
                "timestamp": t.timestamp,
                "transaction_type": t.transaction_type,
                "zone_id": t.zone_id
            } for t in transactions]
            df_tx = pd.DataFrame(tx_records)
            df_feat = extract_transaction_features(df_tx)
            anomaly_scores = anomaly_detector.score_transactions(df_feat)
            
            # Map anomaly scores back to DB records
            for idx, score in enumerate(anomaly_scores):
                transactions[idx].anomaly_score = float(score)
                transactions[idx].is_suspicious = bool(score >= 65.0)

        # 3. DBSCAN clustering on ATM and transaction coordinates
        coords = [(t.latitude, t.longitude) for t in transactions[:300]]
        clusters = geo_cluster_engine.cluster_events(coords)

        # 4. Update zone hotspots
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        total_risk = 0.0

        for h in hotspots:
            zone_tx = [t for t in transactions if t.zone_id == h.zone_id]
            zone_cp = [c for c in complaints if c.location == h.zone_name or c.district == h.district]
            zone_atms = [a for a in atms if a.zone_id == h.zone_id]

            h.related_complaints = len(zone_cp)
            h.suspicious_transactions = sum(1 for t in zone_tx if getattr(t, "is_suspicious", False))
            h.nearby_atms = len(zone_atms)

            # Compute features
            feat = calculate_zone_features(
                zone_id=h.zone_id,
                transactions=zone_tx,
                complaints=zone_cp,
                nearby_atms_count=len(zone_atms)
            )

            # Anomaly component
            tx_anomalies = [t.anomaly_score for t in zone_tx]
            avg_anomaly = float(np.mean(tx_anomalies)) if tx_anomalies else 30.0

            # Crime component
            crime_factor = float(np.clip(len(zone_cp) * 4.5, 10.0, 95.0))

            # Geo clustering component
            geo_factor = float(np.clip(len(zone_atms) * 5.0 + len(zone_tx) * 0.4, 15.0, 95.0))

            # Temporal pattern: evening spike analysis
            evening_tx = [t for t in zone_tx if t.timestamp.hour in [18, 19, 20, 21]]
            temporal_factor = float(np.clip(len(evening_tx) * 6.0, 20.0, 92.0))

            # Graph connectivity proxy
            graph_factor = float(np.clip(h.linked_accounts * 12.0 + 20.0, 10.0, 95.0))

            # Calculate composite score & level
            score, level, factors = risk_scorer.calculate_composite_score(
                transaction_anomaly=avg_anomaly,
                complaint_concentration=crime_factor,
                geographic_clustering=geo_factor,
                temporal_pattern=temporal_factor,
                graph_connectivity=graph_factor
            )

            h.risk_score = score
            h.risk_level = level
            h.factor_transaction_anomaly = factors["transaction_anomaly"]
            h.factor_complaint_concentration = factors["complaint_concentration"]
            h.factor_geo_clustering = factors["geographic_clustering"]
            h.factor_temporal_pattern = factors["temporal_pattern"]
            h.factor_graph_connectivity = factors["graph_connectivity"]
            h.window_risks = risk_scorer.calculate_time_windows(score, h.predicted_time_window)

            total_risk += score
            if level == "CRITICAL":
                critical_count += 1
            elif level == "HIGH":
                high_count += 1
            elif level == "MEDIUM":
                medium_count += 1
            else:
                low_count += 1

        exec_time = round((time.time() - start_time) * 1000, 2)
        avg_risk = round(total_risk / len(hotspots), 1) if hotspots else 0.0

        # Save run record
        run = PredictionRun(
            hotspots_identified=len(hotspots),
            critical_zones=critical_count,
            high_zones=high_count,
            medium_zones=medium_count,
            low_zones=low_count,
            average_risk=avg_risk,
            execution_time_ms=exec_time,
            summary_notes=f"Predictive analysis completed across {len(hotspots)} operational zones."
        )
        db.add(run)
        db.commit()

        return {
            "prediction_id": run.id,
            "hotspots_count": len(hotspots),
            "critical_zones": critical_count,
            "high_zones": high_count,
            "medium_zones": medium_count,
            "low_zones": low_count,
            "average_risk": avg_risk,
            "execution_time_ms": exec_time,
            "clusters_detected": len(clusters)
        }

prediction_service = PredictionService()
