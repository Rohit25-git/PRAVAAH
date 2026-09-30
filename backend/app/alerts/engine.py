from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.alert import Alert
from backend.app.models.prediction import Prediction
from backend.app.models.notification import Notification
from backend.app.alerts.notification import ws_manager

class AlertEngine:
    async def evaluate_prediction_alert(
        self,
        db: Session,
        prediction: Prediction
    ) -> Optional[Alert]:
        """
        Creates deduplicated actionable alert if prediction risk >= 50.0.
        Routes to appropriate jurisdiction and stakeholder agencies.
        """
        if prediction.risk_score < 50.0:
            return None

        # Check existing alert for this prediction
        existing = db.query(Alert).filter(
            Alert.prediction_id == prediction.id,
            Alert.status.in_(["NEW", "ACKNOWLEDGED", "ASSIGNED", "UNDER_INVESTIGATION"])
        ).first()

        if existing:
            # Update score if changed
            existing.risk_score = prediction.risk_score
            existing.severity = prediction.risk_level
            db.commit()
            return existing

        reason = (
            f"Model forecasts elevated cash-withdrawal probability ({prediction.risk_score}/100) "
            f"in {prediction.district}, {prediction.state} during window {prediction.predicted_time_window}."
        )

        alert = Alert(
            prediction_id=prediction.id,
            severity=prediction.risk_level,
            risk_score=prediction.risk_score,
            location=f"{prediction.district}, {prediction.state}",
            predicted_time_window=prediction.predicted_time_window,
            status="NEW",
            agency="State Cyber Crime Investigation Unit",
            jurisdiction=prediction.state,
            reason=reason,
            created_at=datetime.utcnow()
        )
        db.add(alert)
        db.flush()

        # Create system notification
        notif = Notification(
            alert_id=alert.id,
            recipient_type="LEA",
            recipient="Duty Officer",
            channel="WEBSOCKET",
            status="UNREAD",
            message=reason
        )
        db.add(notif)
        db.commit()

        # Broadcast via WebSocket in non-blocking background task
        try:
            import asyncio
            asyncio.create_task(ws_manager.broadcast({
                "event": "NEW_ALERT",
                "alert": {
                    "id": alert.id,
                    "severity": alert.severity,
                    "risk_score": alert.risk_score,
                    "location": alert.location,
                    "predicted_time_window": alert.predicted_time_window,
                    "status": alert.status,
                    "jurisdiction": alert.jurisdiction,
                    "reason": alert.reason,
                    "created_at": alert.created_at.isoformat()
                }
            }))
        except Exception:
            pass

        return alert

alert_engine = AlertEngine()
