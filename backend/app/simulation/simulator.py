import uuid
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from backend.app.models.transaction import Transaction
from backend.app.models.hotspot import Hotspot
from backend.app.models.alert import Alert
from backend.app.alerts.engine import alert_engine
from backend.app.alerts.notification import ws_manager

class LiveSimulator:
    async def run_simulation(self, db: Session, target_zone_id: str = "ZONE-17") -> dict:
        """
        Executes live simulation flow:
        1. Selects or sets up target zone (Zone 17)
        2. Injects rapid anomalous withdrawals
        3. Spikes transaction anomaly and risk score
        4. Updates Hotspot to CRITICAL (e.g. 87 / 100)
        5. Triggers new CRITICAL alert
        6. Broadcasts SIMULATION_UPDATE via WebSocket
        """
        target_hotspot = db.query(Hotspot).filter(Hotspot.zone_id == target_zone_id).first()
        if not target_hotspot:
            # Fallback to the first available hotspot
            target_hotspot = db.query(Hotspot).first()
        
        if not target_hotspot:
            return {"status": "error", "message": "No hotspots available in database."}

        # 1. Inject 8 rapid high-value ATM withdrawals in the last 15 minutes
        now = datetime.utcnow()
        new_transactions = []
        for i in range(8):
            tx_id = f"SIM-TX-{str(uuid.uuid4())[:8].upper()}"
            amount = round(random.uniform(20000, 45000), 2)
            # Slight coordinate jitter within 300 meters
            lat_jitter = random.uniform(-0.002, 0.002)
            lon_jitter = random.uniform(-0.002, 0.002)

            tx = Transaction(
                transaction_id=tx_id,
                account_id=f"ACC-MULE-{random.randint(1001, 1099)}",
                beneficiary_account=f"ACC-CASH-{random.randint(8001, 8099)}",
                atm_id=f"ATM-{random.randint(101, 140)}",
                amount=amount,
                transaction_type="ATM_WITHDRAWAL",
                timestamp=now - timedelta(minutes=random.randint(1, 15)),
                latitude=target_hotspot.latitude + lat_jitter,
                longitude=target_hotspot.longitude + lon_jitter,
                location_name=f"{target_hotspot.zone_name} ATM Hub",
                zone_id=target_hotspot.zone_id,
                state=target_hotspot.state,
                bank_name="State Financial Bank",
                is_suspicious=True,
                anomaly_score=94.5,
                risk_score=91.0,
                status="FLAGGED"
            )
            db.add(tx)
            new_transactions.append(tx)

        # 2. Elevate Hotspot Risk Intelligence
        target_hotspot.risk_score = 87.5
        target_hotspot.risk_level = "CRITICAL"
        target_hotspot.suspicious_transactions += 8
        target_hotspot.factor_transaction_anomaly = 92.0
        target_hotspot.factor_complaint_concentration = 84.0
        target_hotspot.factor_geo_clustering = 79.0
        target_hotspot.factor_temporal_pattern = 71.0
        target_hotspot.factor_graph_connectivity = 68.0
        target_hotspot.predicted_time_window = "18:00 - 22:00"
        target_hotspot.window_risks = {
            "00-06": 28.0,
            "06-12": 45.0,
            "12-18": 68.0,
            "18-22": 92.5,
            "22-00": 74.0
        }
        target_hotspot.last_updated = now

        db.commit()
        db.refresh(target_hotspot)

        # 3. Generate Alert
        alert = await alert_engine.evaluate_hotspot_and_alert(db, target_hotspot)

        # 4. Broadcast live simulation event
        await ws_manager.broadcast({
            "event": "SIMULATION_TRIGGERED",
            "zone_id": target_hotspot.zone_id,
            "zone_name": target_hotspot.zone_name,
            "new_risk_score": target_hotspot.risk_score,
            "new_risk_level": target_hotspot.risk_level,
            "injected_transactions": len(new_transactions),
            "alert_code": alert.alert_code if alert else None
        })

        return {
            "status": "success",
            "message": f"Live simulation triggered for {target_hotspot.zone_name}. Risk elevated to {target_hotspot.risk_score} (CRITICAL).",
            "zone_id": target_hotspot.zone_id,
            "zone_name": target_hotspot.zone_name,
            "risk_score": target_hotspot.risk_score,
            "risk_level": target_hotspot.risk_level,
            "injected_transactions": len(new_transactions),
            "alert": {
                "alert_code": alert.alert_code,
                "severity": alert.severity,
                "reason": alert.reason
            } if alert else None
        }

live_simulator = LiveSimulator()
