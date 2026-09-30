from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database.session import get_db
from backend.app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["Live Simulation"])

@router.post("/trigger")
async def trigger_live_simulation(
    district: Optional[str] = Query("Central Delhi"),
    db: Session = Depends(get_db)
):
    """
    Triggers live simulation of suspicious withdrawal wave,
    elevating risk and broadcasting critical alert in real time.
    """
    res = await simulation_service.run_live_simulation(db, target_district=district)
    return res
