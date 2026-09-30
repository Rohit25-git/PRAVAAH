import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.app.database.session import get_db
from backend.app.models.case import Case
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.case import CaseCreate, CaseUpdate, CaseOut

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=List[CaseOut])
def get_cases(db: Session = Depends(get_db)):
    return db.query(Case).order_by(Case.created_at.desc()).all()

@router.post("", response_model=CaseOut)
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    ref = f"CASE-{datetime.utcnow().year}-{str(uuid.uuid4())[:6].upper()}"
    new_case = Case(
        case_reference=ref,
        category=case_in.category,
        priority=case_in.priority,
        status="OPEN",
        jurisdiction=case_in.jurisdiction,
        assigned_agency=case_in.assigned_agency,
        assigned_officer=case_in.assigned_officer
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    audit = AuditLog(
        action="CASE_CREATE",
        entity_type="CASE",
        entity_id=str(new_case.id),
        metadata_json=f'{{"case_reference": "{new_case.case_reference}"}}'
    )
    db.add(audit)
    db.commit()

    return new_case

@router.get("/{id}", response_model=CaseOut)
def get_case_by_id(id: int, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    return c
