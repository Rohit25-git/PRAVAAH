from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.app.database.session import get_db
from backend.app.models.investigation import Investigation
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.investigation import InvestigationCreate, InvestigationUpdate, InvestigationOut

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.get("", response_model=List[InvestigationOut])
def get_investigations(db: Session = Depends(get_db)):
    return db.query(Investigation).order_by(Investigation.created_at.desc()).all()

@router.post("", response_model=InvestigationOut)
def create_investigation(inv_in: InvestigationCreate, db: Session = Depends(get_db)):
    inv = Investigation(
        case_id=inv_in.case_id,
        investigator=inv_in.investigator,
        status="ACTIVE",
        priority=inv_in.priority,
        notes=inv_in.notes
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    audit = AuditLog(
        action="INVESTIGATION_CREATE",
        entity_type="INVESTIGATION",
        entity_id=str(inv.id),
        metadata_json=f'{{"case_id": {inv.case_id}, "investigator": "{inv.investigator}"}}'
    )
    db.add(audit)
    db.commit()

    return inv

@router.get("/{id}", response_model=InvestigationOut)
def get_investigation_by_id(id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv
