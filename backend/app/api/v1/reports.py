from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.schemas.report import ReportGenerateRequest, ReportOut
from backend.app.services.report_service import report_service
from backend.app.models.audit_log import AuditLog

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportOut)
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    report = report_service.generate_intelligence_report(
        db,
        prediction_id=req.prediction_id,
        case_id=req.case_id,
        title=req.title
    )
    
    audit = AuditLog(
        action="REPORT_GENERATE",
        entity_type="REPORT",
        entity_id=report.report_id,
        metadata_json=f'{{"title": "{report.title}"}}'
    )
    db.add(audit)
    db.commit()

    return report

@router.get("", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    # Generate default representative report
    rep = report_service.generate_intelligence_report(db)
    return [rep]
