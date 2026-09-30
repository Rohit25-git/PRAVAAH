import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.prediction import Prediction
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.case import Case
from backend.app.models.complaint import Complaint
from backend.app.models.transaction import Transaction
from backend.app.models.evidence import Evidence
from backend.app.schemas.report import ReportOut

class ReportService:
    def generate_intelligence_report(
        self,
        db: Session,
        prediction_id: Optional[int] = None,
        case_id: Optional[int] = None,
        title: Optional[str] = None
    ) -> ReportOut:
        report_id = f"REP-{str(uuid.uuid4())[:8].upper()}"
        now = datetime.utcnow()

        # Retrieve prediction context
        pred = db.query(Prediction).filter(Prediction.id == prediction_id).first() if prediction_id else db.query(Prediction).order_by(Prediction.risk_score.desc()).first()
        target_case = db.query(Case).filter(Case.id == case_id).first() if case_id else db.query(Case).first()

        district = pred.district if pred else "Central Delhi"
        state = pred.state if pred else "Delhi"
        risk_score = pred.risk_score if pred else 82.5
        risk_level = pred.risk_level if pred else "CRITICAL"
        time_window = pred.predicted_time_window if pred else "18:00–22:00"
        conf = pred.confidence if pred else 0.88

        # Query relevant complaints & transactions
        cps = db.query(Complaint).filter(Complaint.district == district).limit(6).all()
        txs = db.query(Transaction).filter(Transaction.district == district, Transaction.transaction_type == "ATM_WITHDRAWAL").limit(6).all()
        evs = db.query(Evidence).limit(3).all()

        factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == pred.id).all() if pred else []
        factors_list = [
            {"factor": f.factor_name, "contribution": f.contribution, "explanation": f.explanation}
            for f in factors
        ] if factors else [
            {"factor": "Transaction Anomaly", "contribution": 85.0, "explanation": "Sharp spike in ATM withdrawal amounts"},
            {"factor": "Historical Cybercrime", "contribution": 80.0, "explanation": "Concentrated citizen complaints in district"},
            {"factor": "Geographic Concentration", "contribution": 75.0, "explanation": "Dense cluster of commercial ATMs"},
            {"factor": "Temporal Pattern", "contribution": 70.0, "explanation": "Repetitive evening withdrawal surge"}
        ]

        exec_summary = (
            f"This operational intelligence report synthesizes proactive risk indicators for {district}, {state}. "
            f"The predictive framework forecast a high likelihood of coordinated cash withdrawal activity during the {time_window} "
            f"window with a composite risk score of {risk_score}/100 ({risk_level}). Proactive monitoring is advised."
        )

        risk_assessment = (
            f"Model indicates elevated risk based on observed synthetic patterns combining citizen complaint density and "
            f"unusual transaction velocity. Recommended for law enforcement and banking stakeholder review."
        )

        operational_recommendations = [
            f"Deploy mobile law enforcement surveillance teams near identified ATM kiosks in {district} during {time_window}.",
            "Coordinate with nodal bank fraud desks to enable real-time step-up authentication on high-value cardless withdrawals.",
            "Cross-reference suspect account references against national cybercrime investigation databases.",
            "Maintain chain of custody on CCTV and ATM journal evidence logs with cryptographic verification."
        ]

        timeline = [
            {"time": "T-48h", "event": "Cybercrime complaints filed regarding fake loan schemes"},
            {"time": "T-24h", "event": "Funds routed through 4 intermediary mule accounts"},
            {"time": "T-12h", "event": "Spatial clustering detected around commercial ATM corridor"},
            {"time": "T-2h", "event": "Predictive model triggered critical hotspot forecast"},
            {"time": "Present", "event": "Proactive intelligence report generated for human review"}
        ]

        return ReportOut(
            report_id=report_id,
            generated_at=now,
            title=title or f"Proactive Cyber-Fraud Intelligence Advisory — {district}",
            executive_summary=exec_summary,
            risk_assessment=risk_assessment,
            predicted_hotspot={
                "district": district,
                "state": state,
                "latitude": pred.latitude if pred else 28.6139,
                "longitude": pred.longitude if pred else 77.2090,
                "risk_score": risk_score,
                "risk_level": risk_level
            },
            predicted_time_window=time_window,
            prediction_confidence=conf,
            transaction_analysis={
                "anomalous_withdrawals_detected": len(txs),
                "total_sample_amount": sum(t.amount for t in txs),
                "transactions": [{"ref": t.transaction_reference, "amount": t.amount, "atm": t.atm_id} for t in txs]
            },
            complaint_analysis={
                "complaints_in_district": len(cps),
                "complaints": [{"ref": c.complaint_reference, "category": c.category, "amount": c.amount} for c in cps]
            },
            related_entities=["ACC-MULE-1042", "ACC-MULE-1088", "ATM-CENTRAL-12", "DEV-IP-992"],
            timeline=timeline,
            risk_factors=factors_list,
            related_cases=[{"reference": target_case.case_reference, "category": target_case.category}] if target_case else [],
            evidence_references=[
                {"id": e.evidence_type, "desc": e.description, "sha256": e.sha256_hash, "status": e.integrity_status}
                for e in evs
            ],
            operational_recommendations=operational_recommendations,
            disclaimer="All predictions are analytical indicators based on synthetic demonstration data. They do not constitute legal proof or certainty of criminal intent."
        )

report_service = ReportService()
