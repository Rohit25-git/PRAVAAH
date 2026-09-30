import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.app.database.session import get_db
from backend.app.models.evidence import Evidence
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.investigation import EvidenceCreate, EvidenceOut

router = APIRouter(tags=["Evidence"])

@router.post("/evidence", response_model=EvidenceOut)
def upload_evidence(ev_in: EvidenceCreate, db: Session = Depends(get_db)):
    # Calculate real cryptographic SHA-256 hash
    content_to_hash = f"{ev_in.case_id}:{ev_in.evidence_type}:{ev_in.description}:{ev_in.file_reference}:{datetime.utcnow().isoformat()}"
    calculated_hash = hashlib.sha256(content_to_hash.encode("utf-8")).hexdigest()

    ev = Evidence(
        case_id=ev_in.case_id,
        evidence_type=ev_in.evidence_type,
        description=ev_in.description,
        file_reference=ev_in.file_reference,
        uploaded_by=ev_in.uploaded_by,
        timestamp=datetime.utcnow(),
        sha256_hash=ev_in.sha256_hash or calculated_hash,
        integrity_status="VERIFIED"
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    audit = AuditLog(
        action="EVIDENCE_UPLOAD",
        entity_type="EVIDENCE",
        entity_id=str(ev.id),
        metadata_json=f'{{"sha256": "{ev.sha256_hash}", "case_id": {ev.case_id}}}'
    )
    db.add(audit)
    db.commit()

    return ev

@router.get("/cases/{id}/evidence", response_model=List[EvidenceOut])
def get_case_evidence(id: int, db: Session = Depends(get_db)):
    return db.query(Evidence).filter(Evidence.case_id == id).all()
