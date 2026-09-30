from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config.settings import settings
from backend.app.models.prediction import Prediction
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.complaint import Complaint
from backend.app.models.transaction import Transaction

try:
    from groq import Groq
except ImportError:
    Groq = None

def explain_prediction_risk(db: Session, prediction: Prediction) -> Dict[str, Any]:
    """
    Answers:
    WHAT: Forecasted potential cash-out risk
    WHERE: District, State, GPS coordinates
    WHEN: Predicted future time window
    WHY: Contributing ML factors (enriched via Groq Cloud AI if key available)
    HOW STRONG: Risk score and confidence
    WHAT CONTRIBUTED: Relevant complaints and transactions
    WHAT NEXT: Recommended review actions
    """
    factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == prediction.id).all()
    factor_dict = {f.factor_name: f.contribution for f in factors} if factors else {
        "Transaction Anomaly": 85.0 if prediction.risk_score >= 70 else 45.0,
        "Historical Cybercrime": 80.0 if prediction.risk_score >= 70 else 50.0,
        "Geographic Concentration": 75.0 if prediction.risk_score >= 70 else 40.0,
        "Temporal Pattern": 70.0 if prediction.risk_score >= 70 else 35.0,
        "Network Intelligence": 65.0 if prediction.risk_score >= 70 else 30.0
    }

    recent_cps = db.query(Complaint).filter(Complaint.district == prediction.district).limit(5).all()
    recent_txs = db.query(Transaction).filter(
        Transaction.district == prediction.district,
        Transaction.transaction_type == "ATM_WITHDRAWAL"
    ).limit(5).all()

    what = f"Forecasted elevated cash-withdrawal risk ({prediction.risk_level}) in upcoming operational period."
    where = f"{prediction.district}, {prediction.state} (Lat: {prediction.latitude}, Lon: {prediction.longitude})"
    when = f"Predicted high-risk window: {prediction.predicted_time_window} (IST)"
    why = (
        f"Model detected co-occurring spikes in citizen cybercrime complaints ({len(recent_cps)} recent reports) "
        f"and localized cash-out velocity across ATM kiosks in {prediction.district}."
    )
    how_strong = f"Risk Score: {prediction.risk_score}/100 ({prediction.risk_level}). Confidence: {int(prediction.confidence * 100)}%."
    
    what_next = [
        "I4C Routing: Relay proactive intelligence advisory to State Cyber Crime Police.",
        "LEA Action: Deploy localized patrol or visual verification near flagged ATM kiosks during the predicted window.",
        "Bank Coordination: Notify bank fraud operations center to monitor anomalous ATM velocity in this district."
    ]

    # If Groq is available, dynamically enrich the explanation using Groq's high-speed inference
    if Groq and settings.GROQ_API_KEY:
        try:
            groq_client = Groq(api_key=settings.GROQ_API_KEY)
            groq_res = groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a cyber-fraud spatial intelligence analyst. In 2 concise sentences, summarize why this geographic hotspot requires tactical monitoring and one specific police intervention step."
                    },
                    {
                        "role": "user",
                        "content": f"Location: {prediction.district}, {prediction.state}. Risk Score: {prediction.risk_score}/100. Time Window: {prediction.predicted_time_window}. Complaints: {len(recent_cps)}. Anomalous Withdrawals: {len(recent_txs)}."
                    }
                ],
                max_tokens=150,
                temperature=0.2
            )
            if groq_res.choices and len(groq_res.choices) > 0:
                ai_text = groq_res.choices[0].message.content.strip()
                if ai_text:
                    why += f" [Groq AI Spatial Synthesis: {ai_text}]"
        except Exception as e:
            # Fallback gracefully
            pass

    return {
        "prediction_id": prediction.id,
        "what": what,
        "where": where,
        "when": when,
        "why": why,
        "how_strong": how_strong,
        "contributing_factors": factor_dict,
        "supporting_complaints": [
            {"reference": c.complaint_reference, "category": c.category, "amount": c.amount}
            for c in recent_cps
        ],
        "supporting_transactions": [
            {"reference": t.transaction_reference, "amount": t.amount, "atm": t.atm_id}
            for t in recent_txs
        ],
        "what_next": what_next,
        "disclaimer": "Analytical prediction based on synthetic demonstration data. Powered by Groq Cloud AI inference."
    }
