import os
import sys
import json
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import bcrypt
from geoalchemy2.elements import WKTElement

from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.user import User
from backend.app.models.account import Account
from backend.app.models.atm import ATM
from backend.app.models.complaint import Complaint
from backend.app.models.transaction import Transaction
from backend.app.models.case import Case
from backend.app.models.prediction import Prediction
from backend.app.models.prediction_run import PredictionRun
from backend.app.models.risk_factor import RiskFactor
from backend.app.models.alert import Alert
from backend.app.models.investigation import Investigation
from backend.app.models.evidence import Evidence
from backend.app.models.relationship import Relationship
from backend.app.models.notification import Notification
from backend.app.models.audit_log import AuditLog

DATA_DIR = "data/synthetic"

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed_database():
    print("Initializing PRAVAAH Database Schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Demo Users (4 Roles)
        print("Seeding Official PRAVAAH Users...")
        demo_users = [
            {
                "name": "Rajesh Kumar (I4C Nodal Officer)",
                "email": "i4c.officer@pravaah.gov.in",
                "password_hash": hash_pw("password123"),
                "role": "I4C_OFFICER",
                "agency": "Indian Cyber Crime Coordination Centre (I4C)",
                "jurisdiction": "National"
            },
            {
                "name": "Inspector Vikram Malhotra",
                "email": "lea.officer@delhi.police.gov.in",
                "password_hash": hash_pw("password123"),
                "role": "LEA_OFFICER",
                "agency": "Delhi Police Cyber Cell",
                "jurisdiction": "Delhi"
            },
            {
                "name": "Priya Sharma (Fraud Risk Lead)",
                "email": "bank.analyst@nationalbank.in",
                "password_hash": hash_pw("password123"),
                "role": "BANK_ANALYST",
                "agency": "National Commercial Banking Nodal Desk",
                "jurisdiction": "Multi-Bank FI"
            },
            {
                "name": "System Administrator",
                "email": "admin@pravaah.gov.in",
                "password_hash": hash_pw("admin123"),
                "role": "ADMIN",
                "agency": "PRAVAAH Central Administration",
                "jurisdiction": "System"
            },
            # Additional domain aliases
            {
                "name": "Inspector Vikram Malhotra",
                "email": "lea.officer@pravaah.gov.in",
                "password_hash": hash_pw("password123"),
                "role": "LEA_OFFICER",
                "agency": "Delhi Police Cyber Cell",
                "jurisdiction": "Delhi"
            },
            {
                "name": "Priya Sharma (Fraud Risk Lead)",
                "email": "bank.analyst@pravaah.gov.in",
                "password_hash": hash_pw("password123"),
                "role": "BANK_ANALYST",
                "agency": "National Commercial Banking Nodal Desk",
                "jurisdiction": "Multi-Bank FI"
            },
            # Backward compatibility aliases
            {
                "name": "Rajesh Kumar (I4C Nodal Officer)",
                "email": "i4c.officer@cybershield.gov.in",
                "password_hash": hash_pw("password123"),
                "role": "I4C_OFFICER",
                "agency": "Indian Cyber Crime Coordination Centre (I4C)",
                "jurisdiction": "National"
            },
            {
                "name": "System Administrator",
                "email": "admin@cybershield.gov.in",
                "password_hash": hash_pw("admin123"),
                "role": "ADMIN",
                "agency": "PRAVAAH Central Administration",
                "jurisdiction": "System"
            }
        ]

        for u in demo_users:
            if not db.query(User).filter(User.email == u["email"]).first():
                db.add(User(**u))
        db.commit()

        # Check if dataset already loaded
        if db.query(Transaction).count() >= 5000:
            print(f"Database already populated with {db.query(Transaction).count():,} transactions.")
            return

        # Load synthetic datasets
        print("Loading synthetic files from data/synthetic/ ...")
        with open(f"{DATA_DIR}/accounts.json") as f:
            accounts_data = json.load(f)
        with open(f"{DATA_DIR}/atms.json") as f:
            atms_data = json.load(f)
        with open(f"{DATA_DIR}/complaints.json") as f:
            complaints_data = json.load(f)
        with open(f"{DATA_DIR}/transactions.json") as f:
            tx_data = json.load(f)
        with open(f"{DATA_DIR}/cases.json") as f:
            cases_data = json.load(f)
        with open(f"{DATA_DIR}/relationships.json") as f:
            rel_data = json.load(f)

        print(f"Inserting {len(accounts_data):,} accounts...")
        db.bulk_insert_mappings(Account, [
            {
                "account_reference": a["account_reference"],
                "bank": a["bank"],
                "account_type": a["account_type"],
                "status": a["status"]
            } for a in accounts_data
        ])

        print(f"Inserting {len(atms_data):,} ATMs...")
        db.bulk_insert_mappings(ATM, [
            {
                "atm_reference": a["atm_reference"],
                "bank": a["bank"],
                "latitude": a["latitude"],
                "longitude": a["longitude"],
                "location": f"SRID=4326;POINT({a['longitude']} {a['latitude']})",
                "district": a["district"],
                "state": a["state"],
                "location_type": a["location_type"],
                "active": a["active"]
            } for a in atms_data
        ])

        print(f"Inserting {len(complaints_data):,} Cybercrime Complaints...")
        db.bulk_insert_mappings(Complaint, [
            {
                "complaint_reference": c["complaint_reference"],
                "category": c["category"],
                "amount": c["amount"],
                "timestamp": datetime.fromisoformat(c["timestamp"]),
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "location": f"SRID=4326;POINT({c['longitude']} {c['latitude']})",
                "district": c["district"],
                "state": c["state"],
                "status": c["status"]
            } for c in complaints_data
        ])

        print(f"Inserting {len(tx_data):,} Financial Transactions & Withdrawals...")
        db.bulk_insert_mappings(Transaction, [
            {
                "transaction_reference": t["transaction_reference"],
                "account_id": t["account_id"],
                "transaction_type": t["transaction_type"],
                "amount": t["amount"],
                "timestamp": datetime.fromisoformat(t["timestamp"]),
                "latitude": t["latitude"],
                "longitude": t["longitude"],
                "location": f"SRID=4326;POINT({t['longitude']} {t['latitude']})",
                "atm_id": t["atm_id"],
                "bank": t["bank"],
                "district": t["district"],
                "state": t["state"],
                "device_id": t["device_id"],
                "phone_id": t["phone_id"],
                "risk_indicator": t["risk_indicator"]
            } for t in tx_data
        ])

        print(f"Inserting {len(cases_data):,} Cases...")
        db.bulk_insert_mappings(Case, [
            {
                "case_reference": c["case_reference"],
                "category": c["category"],
                "priority": c["priority"],
                "status": c["status"],
                "jurisdiction": c["jurisdiction"],
                "assigned_agency": c["assigned_agency"],
                "assigned_officer": c["assigned_officer"]
            } for c in cases_data
        ])

        print(f"Inserting {len(rel_data):,} Graph Relationships...")
        db.bulk_insert_mappings(Relationship, [
            {
                "source_entity_type": r["source_entity_type"],
                "source_entity_id": r["source_entity_id"],
                "target_entity_type": r["target_entity_type"],
                "target_entity_id": r["target_entity_id"],
                "relationship_type": r["relationship_type"],
                "weight": r["weight"]
            } for r in rel_data
        ])
        db.commit()

        # Seed Investigations & Verified Cryptographic Evidence
        print("Seeding Investigations & Evidence with real SHA-256 hashes...")
        cases = db.query(Case).limit(20).all()
        for c in cases:
            inv = Investigation(
                case_id=c.id,
                investigator=c.assigned_officer or "Inspector Sharma",
                status="ACTIVE",
                priority=c.priority,
                notes=f"Active cross-jurisdiction inquiry into fraudulent cash withdrawal pattern connected to {c.category}."
            )
            db.add(inv)
            
            import hashlib
            raw_ev = f"{c.id}:ATM_SURVEILLANCE_FOOTAGE:Kiosk camera snapshot during withdrawal window:{datetime.utcnow().isoformat()}"
            real_sha = hashlib.sha256(raw_ev.encode("utf-8")).hexdigest()

            ev = Evidence(
                case_id=c.id,
                evidence_type="ATM_SURVEILLANCE_FOOTAGE",
                description="High-definition CCTV frame capture showing cash withdrawal sequence at commercial ATM kiosk.",
                file_reference=f"evidence/cctv/{c.case_reference}_cam01.mp4",
                uploaded_by="Forensic Video Analyst",
                timestamp=datetime.utcnow() - timedelta(hours=random.randint(2, 48)),
                sha256_hash=real_sha,
                integrity_status="VERIFIED"
            )
            db.add(ev)
        db.commit()

        # Seed Initial Prediction Runs & Active Predictions
        print("Seeding Initial Predictions, Risk Factors, and Actionable Alerts...")
        now = datetime.utcnow()
        valid_until = now + timedelta(hours=24)

        run = PredictionRun(
            model_version="v1.4-rf-supervised",
            training_data_version="synthetic-dataset-v1.0",
            feature_version="complaint-driven-v1.2",
            observation_window="Previous 7 Days",
            prediction_horizon="Next 24 Hours",
            records_scored=10500,
            zones_scored=100,
            status="COMPLETED",
            metrics_json=json.dumps({"precision": 0.88, "recall": 0.85, "f1_score": 0.865, "roc_auc": 0.912})
        )
        db.add(run)
        db.commit()

        # Seed High-Risk Predictions in Top Metro Districts
        top_districts = [
            ("Central Delhi", "Delhi", 28.6139, 77.2090, 87.5, "CRITICAL", "18:00–22:00", 0.92, 0.88),
            ("Mumbai City", "Maharashtra", 18.9388, 72.8354, 82.0, "CRITICAL", "18:00–22:00", 0.89, 0.84),
            ("Bengaluru Urban", "Karnataka", 12.9716, 77.5946, 76.5, "HIGH", "12:00–18:00", 0.85, 0.78),
            ("Hyderabad", "Telangana", 17.3850, 78.4867, 72.0, "HIGH", "18:00–22:00", 0.82, 0.74),
            ("Kolkata", "West Bengal", 22.5726, 88.3639, 68.0, "HIGH", "12:00–18:00", 0.79, 0.69),
            ("Ahmedabad", "Gujarat", 23.0225, 72.5714, 62.5, "HIGH", "06:00–12:00", 0.76, 0.64),
            ("Jaipur", "Rajasthan", 26.9124, 75.7873, 54.0, "HIGH", "18:00–22:00", 0.74, 0.58),
            ("Noida", "Uttar Pradesh", 28.5355, 77.3910, 48.0, "MEDIUM", "12:00–18:00", 0.71, 0.49),
            ("Pune", "Maharashtra", 18.5204, 73.8567, 44.0, "MEDIUM", "06:00–12:00", 0.70, 0.45),
            ("Chennai", "Tamil Nadu", 13.0827, 80.2707, 36.0, "MEDIUM", "00:00–06:00", 0.68, 0.38)
        ]

        for dist, st, lat, lon, score, level, win, conf, prob in top_districts:
            zid = f"ZONE-{random.randint(1, 100):03d}"
            pred = Prediction(
                zone_id=zid,
                latitude=lat,
                longitude=lon,
                location=WKTElement(f"POINT({lon} {lat})", srid=4326),
                state=st,
                district=dist,
                predicted_time_window=win,
                time_window_probability=round(conf, 2),
                future_hotspot_probability=round(prob, 2),
                risk_score=score,
                risk_level=level,
                confidence=conf,
                uncertainty=round(1.0 - conf, 2),
                model_version="v1.4-rf-supervised",
                prediction_timestamp=now,
                valid_until=valid_until,
                status="ACTIVE"
            )
            db.add(pred)
            db.commit()
            db.refresh(pred)

            # Factors
            factors = [
                ("Transaction Anomaly", min(100.0, score * 1.08), "Anomalous velocity and amount deviations observed"),
                ("Historical Cybercrime", min(100.0, score * 0.98), f"High density of cybercrime complaints in {dist}"),
                ("Geographic Concentration", min(100.0, score * 0.92), "ATM spatial cluster exhibits elevated cash-out risk"),
                ("Temporal Pattern", 88.0 if win == "18:00–22:00" else 52.0, "Repetitive evening withdrawal surge detected"),
                ("Network Intelligence", 70.0, "Mule account network graph shows high PageRank centrality")
            ]
            for fname, contrib, expl in factors:
                db.add(RiskFactor(
                    prediction_id=pred.id,
                    factor_name=fname,
                    contribution=round(contrib, 1),
                    explanation=expl
                ))

            # Create Alert if score >= 50.0
            if score >= 50.0:
                alert = Alert(
                    prediction_id=pred.id,
                    severity=level,
                    risk_score=score,
                    location=f"{dist} ATM Corridor, {st}",
                    predicted_time_window=win,
                    status="NEW",
                    agency=f"{st} Cyber Crime Investigation Unit",
                    jurisdiction=st,
                    reason=f"Model predicts elevated cash-out probability ({score}/100) during {win}.",
                    created_at=now - timedelta(minutes=random.randint(5, 120))
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)

                db.add(Notification(
                    alert_id=alert.id,
                    recipient_type="LEA",
                    recipient="Duty Officer",
                    channel="WEBSOCKET",
                    status="UNREAD",
                    message=alert.reason
                ))

            db.commit()

        # Seed initial Audit Log
        db.add(AuditLog(
            user_id=1,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id="CYBERSHIELD_ROOT",
            metadata_json='{"status": "Database successfully initialized and seeded with 10k+ records."}'
        ))
        db.commit()

        print("\nDatabase seeded successfully!")
        print("Demo Credentials:")
        print("  - I4C Officer:   i4c.officer@cybershield.gov.in  / password123")
        print("  - LEA Officer:   lea.officer@delhi.police.gov.in / password123")
        print("  - Bank Analyst:  bank.analyst@nationalbank.in    / password123")
        print("  - Administrator: admin@cybershield.gov.in        / admin123")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
