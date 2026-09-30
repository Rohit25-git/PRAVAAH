from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.prediction import Prediction
from backend.app.models.case import Case
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.ai import (
    AIQueryRequest, AIQueryResponse,
    AIExplainRiskRequest, AIExplainRiskResponse,
    AISummarizeCaseRequest, AISummarizeCaseResponse
)
from backend.app.ai.explain import explain_prediction_risk
from backend.app.ai.copilot import cybershield_copilot

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

@router.post("/query", response_model=AIQueryResponse)
async def query_copilot(req: AIQueryRequest, db: Session = Depends(get_db)):
    pred_id = int(req.context_id) if (req.context_type == "PREDICTION" and req.context_id and req.context_id.isdigit()) else None
    case_id = int(req.context_id) if (req.context_type == "CASE" and req.context_id and req.context_id.isdigit()) else None
    
    res = await cybershield_copilot.answer_investigator_query(
        db,
        query=req.query,
        prediction_id=pred_id,
        case_id=case_id
    )

    audit = AuditLog(
        action="AI_QUERY",
        entity_type="COPILOT",
        entity_id="INVESTIGATOR_QUERY",
        metadata_json=f'{{"query": "{req.query[:80]}", "model": "{res["model_used"]}"}}'
    )
    db.add(audit)
    db.commit()

    return res

@router.post("/explain-risk", response_model=AIExplainRiskResponse)
def explain_risk_endpoint(req: AIExplainRiskRequest, db: Session = Depends(get_db)):
    pred = None
    if req.prediction_id:
        pred = db.query(Prediction).filter(Prediction.id == req.prediction_id).first()
    elif req.district:
        pred = db.query(Prediction).filter(Prediction.district == req.district).first()
    else:
        pred = db.query(Prediction).order_by(Prediction.risk_score.desc()).first()

    if not pred:
        raise HTTPException(status_code=404, detail="No prediction record found to explain")

    res = explain_prediction_risk(db, pred)
    return AIExplainRiskResponse(
        prediction_id=res["prediction_id"],
        what=res["what"],
        where=res["where"],
        when=res["when"],
        why=res["why"],
        how_strong=res["how_strong"],
        contributing_factors=res["contributing_factors"],
        supporting_complaints=res["supporting_complaints"],
        supporting_transactions=res["supporting_transactions"],
        what_next=res["what_next"],
        disclaimer=res["disclaimer"]
    )

@router.post("/summarize-case", response_model=AISummarizeCaseResponse)
def summarize_case_endpoint(req: AISummarizeCaseRequest, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == req.case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    summary = (
        f"Case {c.case_reference} investigates multi-jurisdiction financial cyber fraud ({c.category}). "
        f"Current status: {c.status} with priority {c.priority}. Assigned to {c.assigned_agency} under {c.assigned_officer}."
    )
    timeline = "Initial complaint registered -> Mule transfers identified -> Cash withdrawal hotspot forecasted -> Evidence verified."

    return AISummarizeCaseResponse(
        case_reference=c.case_reference,
        summary=summary,
        timeline_summary=timeline,
        related_entities=["ACC-MULE-1042", "ACC-MULE-1088", "ATM-CENTRAL-12"],
        risk_explanation="High risk of funds extraction before secondary authentication locks are engaged.",
        disclaimer="Case summary derived from synthetic demonstration investigation records."
    )
