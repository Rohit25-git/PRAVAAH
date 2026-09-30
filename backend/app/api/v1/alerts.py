from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.alert import Alert
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.alert import AlertOut, AlertAcknowledge, AlertAssign, AlertResolve
from backend.app.alerts.notification import ws_manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(Alert)
    if severity:
        q = q.filter(Alert.severity == severity)
    if status:
        q = q.filter(Alert.status == status)
    if jurisdiction:
        q = q.filter(Alert.jurisdiction == jurisdiction)
    return q.order_by(Alert.created_at.desc()).limit(limit).all()

@router.get("/{id}", response_model=AlertOut)
def get_alert_by_id(id: int, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    return a

@router.post("/{id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(id: int, data: AlertAcknowledge, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    a.status = "ACKNOWLEDGED"
    a.acknowledged_at = datetime.utcnow()
    if data.assigned_to:
        a.assigned_to = data.assigned_to
    
    audit = AuditLog(
        action="ALERT_ACKNOWLEDGE",
        entity_type="ALERT",
        entity_id=str(a.id),
        metadata_json=f'{{"status": "{a.status}", "assigned_to": "{a.assigned_to}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(a)

    await ws_manager.broadcast({
        "event": "ALERT_STATUS_CHANGED",
        "alert_id": a.id,
        "new_status": a.status,
        "assigned_to": a.assigned_to
    })

    return a

@router.post("/{id}/assign", response_model=AlertOut)
async def assign_alert(id: int, data: AlertAssign, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    a.status = "ASSIGNED"
    a.assigned_to = data.assigned_to
    if data.agency:
        a.agency = data.agency

    audit = AuditLog(
        action="ALERT_ASSIGN",
        entity_type="ALERT",
        entity_id=str(a.id),
        metadata_json=f'{{"assigned_to": "{data.assigned_to}", "agency": "{data.agency}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(a)

    await ws_manager.broadcast({
        "event": "ALERT_STATUS_CHANGED",
        "alert_id": a.id,
        "new_status": a.status,
        "assigned_to": a.assigned_to
    })

    return a

@router.post("/{id}/resolve", response_model=AlertOut)
async def resolve_alert(id: int, data: AlertResolve, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    a.status = "RESOLVED"
    a.resolved_at = datetime.utcnow()

    audit = AuditLog(
        action="ALERT_RESOLVE",
        entity_type="ALERT",
        entity_id=str(a.id),
        metadata_json=f'{{"notes": "{data.resolution_notes}"}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(a)

    await ws_manager.broadcast({
        "event": "ALERT_STATUS_CHANGED",
        "alert_id": a.id,
        "new_status": a.status
    })

    return a
