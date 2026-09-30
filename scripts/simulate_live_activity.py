import asyncio
import sys
import os

# Ensure backend modules are importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.services.simulation_service import simulation_service

async def main():
    print("=" * 65)
    print("CyberShield AI — Live Simulation Trigger")
    print("=" * 65)
    db = SessionLocal()
    try:
        district = "Central Delhi" if len(sys.argv) < 2 else sys.argv[1]
        print(f"Injecting synthetic high-velocity mule withdrawals into: {district} ...")
        res = await simulation_service.run_live_simulation(db, target_district=district)
        print(f"Status: {res.get('status')}")
        print(f"Message: {res.get('message')}")
        print(f"New Risk Score: {res.get('risk_score')} ({res.get('risk_level')})")
        print(f"Predicted Time Window: {res.get('predicted_time_window')}")
        if res.get("alert"):
            print(f"Alert Generated: ID {res['alert']['id']} - Severity: {res['alert']['severity']}")
        print("=" * 65)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
