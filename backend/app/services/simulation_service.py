import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

from geoalchemy2.elements import WKTElement

from backend.app.models.transaction import Transaction
from backend.app.models.prediction import Prediction
from backend.app.models.alert import Alert
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.audit_log import AuditLog
from backend.app.alerts.engine import alert_engine
from backend.app.alerts.notification import ws_manager

class SimulationService:
    async def run_live_simulation(self, db: Session, target_district: str = "Central Delhi") -> Dict[str, Any]:
        """
        Executes live demonstration simulation:
        1. Injects 8 rapid high-value ATM withdrawals into target district
        2. Re-runs risk calculation and elevates prediction to CRITICAL (87.5 / 100)
        3. Generates high-priority Alert with jurisdiction routing
        4. Broadcasts event via WebSocket to dynamically update UI without refreshing
        5. Logs action in AuditLog
        """
        now = datetime.utcnow()
        
        # Find target prediction
        pred = db.query(Prediction).filter(Prediction.district == target_district).first()
        if not pred:
            pred = db.query(Prediction).first()

        if not pred:
            return {"status": "error", "message": "No active predictions found to simulate."}

        # 1. Inject rapid anomalous ATM transactions
        new_txs = []
        for i in range(8):
            tx_ref = f"SIM-TX-{str(uuid.uuid4())[:8].upper()}"
            amt = round(random.uniform(25000, 48000), 2)
            lat_jitter = random.uniform(-0.003, 0.003)
            lon_jitter = random.uniform(-0.003, 0.003)
            sim_lat = round(pred.latitude + lat_jitter, 6)
            sim_lon = round(pred.longitude + lon_jitter, 6)

            tx = Transaction(
                transaction_reference=tx_ref,
                account_id=f"ACC-SIM-{random.randint(101, 140)}",
                transaction_type="ATM_WITHDRAWAL",
                amount=amt,
                timestamp=now - timedelta(minutes=random.randint(1, 12)),
                latitude=sim_lat,
                longitude=sim_lon,
                location=WKTElement(f"POINT({sim_lon} {sim_lat})", srid=4326),
                atm_id=f"ATM-{random.randint(201, 250)}",
                bank="State Commercial Bank",
                district=pred.district,
                state=pred.state,
                device_id="DEV-SIM-01",
                phone_id="PH-SIM-09",
                risk_indicator=95.0,
                created_at=now
            )
            db.add(tx)
            new_txs.append(tx)

        # 2. Elevate Prediction to CRITICAL
        pred.risk_score = 87.5
        pred.risk_level = "CRITICAL"
        pred.confidence = 0.94
        pred.predicted_time_window = "18:00–22:00"
        pred.prediction_timestamp = now
        pred.valid_until = now + timedelta(hours=24)

        # Update Risk Factors
        db.query(RiskFactor).filter(RiskFactor.prediction_id == pred.id).delete()
        sim_factors = [
            ("Transaction Anomaly", 94.0, "Sudden surge in withdrawal frequency and amount velocity within 15 minutes"),
            ("Historical Cybercrime", 86.0, "District has multiple active cyber fraud complaints awaiting resolution"),
            ("Geographic Concentration", 80.0, "Transactions clustered at adjacent commercial ATM kiosks"),
            ("Temporal Pattern", 88.0, "Synchronized cash extraction matching known mule liquidation wave"),
            ("Network Intelligence", 72.0, "Intermediary accounts demonstrate high betweenness centrality")
        ]
        for fname, contrib, expl in sim_factors:
            rf = RiskFactor(
                prediction_id=pred.id,
                factor_name=fname,
                contribution=contrib,
                explanation=expl
            )
            db.add(rf)

        db.commit()
        db.refresh(pred)

        # 3. Create or Update Alert
        alert = await alert_engine.evaluate_prediction_alert(db, pred)

        # 4. Audit Log
        audit = AuditLog(
            user_id=1,
            action="SIMULATION_START",
            entity_type="PREDICTION",
            entity_id=str(pred.id),
            timestamp=now,
            metadata_json=f'{{"district": "{pred.district}", "elevated_risk": 87.5, "transactions_injected": 8}}'
        )
        db.add(audit)
        db.commit()

        # 5. Broadcast live simulation update
        await ws_manager.broadcast({
            "event": "SIMULATION_TRIGGERED",
            "prediction_id": pred.id,
            "district": pred.district,
            "state": pred.state,
            "new_risk_score": pred.risk_score,
            "new_risk_level": pred.risk_level,
            "time_window": pred.predicted_time_window,
            "injected_transactions": len(new_txs),
            "alert_id": alert.id if alert else None
        })

        return {
            "status": "success",
            "message": f"Live simulation triggered for {pred.district}. Risk elevated to {pred.risk_score} (CRITICAL).",
            "prediction_id": pred.id,
            "district": pred.district,
            "state": pred.state,
            "risk_score": pred.risk_score,
            "risk_level": pred.risk_level,
            "predicted_time_window": pred.predicted_time_window,
            "injected_transactions": len(new_txs),
            "alert": {
                "id": alert.id,
                "severity": alert.severity,
                "reason": alert.reason
            } if alert else None
        }

simulation_service = SimulationService()
