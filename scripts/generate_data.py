import os
import json
import random
import uuid
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

OUTPUT_DIR = "data/synthetic"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 20 Major Indian Metro/Tier-1/Tier-2 Clusters with realistic lat/long
HUBS = [
    {"state": "Delhi", "district": "Central Delhi", "lat": 28.6139, "lon": 77.2090},
    {"state": "Delhi", "district": "South Delhi", "lat": 28.5355, "lon": 77.2410},
    {"state": "Delhi", "district": "East Delhi", "lat": 28.6280, "lon": 77.2950},
    {"state": "Maharashtra", "district": "Mumbai City", "lat": 18.9388, "lon": 72.8354},
    {"state": "Maharashtra", "district": "Mumbai Suburban", "lat": 19.1136, "lon": 72.8697},
    {"state": "Maharashtra", "district": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"state": "Karnataka", "district": "Bengaluru Urban", "lat": 12.9716, "lon": 77.5946},
    {"state": "Karnataka", "district": "Bengaluru Rural", "lat": 13.2280, "lon": 77.5750},
    {"state": "Telangana", "district": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    {"state": "Tamil Nadu", "district": "Chennai", "lat": 13.0827, "lon": 80.2707},
    {"state": "West Bengal", "district": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    {"state": "Gujarat", "district": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    {"state": "Rajasthan", "district": "Jaipur", "lat": 26.9124, "lon": 75.7873},
    {"state": "Uttar Pradesh", "district": "Noida", "lat": 28.5355, "lon": 77.3910},
    {"state": "Uttar Pradesh", "district": "Lucknow", "lat": 26.8467, "lon": 80.9462},
    {"state": "Haryana", "district": "Gurugram", "lat": 28.4595, "lon": 77.0266},
    {"state": "Madhya Pradesh", "district": "Indore", "lat": 22.7196, "lon": 75.8577},
    {"state": "Punjab", "district": "Ludhiana", "lat": 30.9010, "lon": 75.8573},
    {"state": "Kerala", "district": "Ernakulam", "lat": 9.9816, "lon": 76.2999},
    {"state": "Bihar", "district": "Patna", "lat": 25.5941, "lon": 85.1376}
]

BANKS = ["State Commercial Bank", "National Trust Bank", "Apex Union Bank", "Bharat Reserve Bank", "Indus Pioneer Bank", "Centurion Bank"]
COMPLAINT_CATEGORIES = [
    "UPI Payment Fraud",
    "Instant Loan App APK Scam",
    "Net Banking Phishing",
    "Social Engineering Sextortion",
    "Part-time Job Work Scam",
    "Investment / Crypto Task Scam",
    "SIM Swap Fraud"
]

def generate_all_synthetic_data():
    print("Generating CyberShield AI Synthetic Demonstration Dataset...")
    random.seed(42)
    np.random.seed(42)
    now = datetime.utcnow()

    # 1. Prediction Zones (100 Zones across the 20 Hubs)
    zones = []
    zone_id = 1
    for hub in HUBS:
        for z in range(5):
            zid = f"ZONE-{zone_id:03d}"
            lat_jitter = random.uniform(-0.04, 0.04)
            lon_jitter = random.uniform(-0.04, 0.04)
            zones.append({
                "zone_id": zid,
                "zone_name": f"{hub['district']} Sector {z+1}",
                "district": hub["district"],
                "state": hub["state"],
                "latitude": round(hub["lat"] + lat_jitter, 6),
                "longitude": round(hub["lon"] + lon_jitter, 6)
            })
            zone_id += 1

    # 2. ATMs (550 ATMs)
    atms = []
    atm_id = 1
    for z in zones:
        num_atms = random.randint(4, 7)
        for _ in range(num_atms):
            lat_j = random.uniform(-0.008, 0.008)
            lon_j = random.uniform(-0.008, 0.008)
            atms.append({
                "atm_reference": f"ATM-{atm_id:04d}",
                "bank": random.choice(BANKS),
                "latitude": round(z["latitude"] + lat_j, 6),
                "longitude": round(z["longitude"] + lon_j, 6),
                "district": z["district"],
                "state": z["state"],
                "location_type": random.choice(["STANDALONE_KIOSK", "BANK_BRANCH_ATM", "SHOPPING_MALL", "TRANSIT_HUB"]),
                "active": True,
                "zone_id": z["zone_id"]
            })
            atm_id += 1

    # 3. Accounts (2,200 Accounts)
    accounts = []
    for i in range(1, 2201):
        is_mule = (i <= 250)
        accounts.append({
            "account_reference": f"ACC-SYNTH-{i:04d}",
            "bank": random.choice(BANKS),
            "account_type": "MULE_SUSPECT" if is_mule else random.choice(["SAVINGS", "CURRENT", "SALARY"]),
            "status": "FLAGGED" if is_mule else "ACTIVE"
        })

    # 4. Complaints (1,200 Complaints over past 30 days)
    complaints = []
    for i in range(1, 1201):
        target_zone = random.choice(zones)
        days_ago = random.uniform(0.1, 28.0)
        c_time = now - timedelta(days=days_ago)
        amt = round(random.choice([
            random.uniform(5000, 25000),
            random.uniform(25000, 150000),
            random.uniform(150000, 800000)
        ]), 2)
        complaints.append({
            "complaint_reference": f"NCRP-SYNTH-2026-{i:05d}",
            "category": random.choice(COMPLAINT_CATEGORIES),
            "amount": amt,
            "timestamp": c_time.isoformat(),
            "latitude": round(target_zone["latitude"] + random.uniform(-0.015, 0.015), 6),
            "longitude": round(target_zone["longitude"] + random.uniform(-0.015, 0.015), 6),
            "district": target_zone["district"],
            "state": target_zone["state"],
            "status": random.choice(["REGISTERED", "UNDER_VERIFICATION", "LINKED_TO_CASE", "DISPATCHED_TO_STATE"])
        })

    # 5. Financial Transactions (10,500 Transactions over past 14 days)
    # INJECTED GROUND TRUTH: Independent ground truth label for ML training
    transactions = []
    tx_id = 1

    # Designate Zone 001, Zone 017, Zone 034, Zone 052 as ground-truth hot withdrawal zones
    hot_zones = {"ZONE-001", "ZONE-017", "ZONE-034", "ZONE-052"}

    for i in range(1, 10501):
        # 25% of transactions gravitate towards designated hot zones to establish genuine correlation
        if random.random() < 0.25:
            z = random.choice([z for z in zones if z["zone_id"] in hot_zones])
            is_suspicious_gt = (random.random() < 0.65)
        else:
            z = random.choice(zones)
            is_suspicious_gt = (random.random() < 0.05)

        days_ago = random.uniform(0.01, 14.0)
        t_time = now - timedelta(days=days_ago)
        
        # Withdrawals more frequent in evening for suspicious events
        is_withdrawal = (random.random() < 0.55 if is_suspicious_gt else random.random() < 0.35)
        tx_type = "ATM_WITHDRAWAL" if is_withdrawal else random.choice(["UPI_TRANSFER", "IMPS", "POS"])

        if is_suspicious_gt:
            amount = round(random.uniform(18000, 49000), 2)
            risk_ind = round(random.uniform(65.0, 98.0), 1)
            # Pick a mule account
            acc = f"ACC-SYNTH-{random.randint(1, 250):04d}"
        else:
            amount = round(float(np.random.exponential(4500)) + 500, 2)
            risk_ind = round(random.uniform(5.0, 40.0), 1)
            acc = f"ACC-SYNTH-{random.randint(251, 2200):04d}"

        # Nearest ATM in zone
        zone_atms = [a for a in atms if a["zone_id"] == z["zone_id"]]
        selected_atm = random.choice(zone_atms)["atm_reference"] if zone_atms else f"ATM-{random.randint(1, 500):04d}"

        transactions.append({
            "transaction_reference": f"TX-SYNTH-{tx_id:06d}",
            "account_id": acc,
            "transaction_type": tx_type,
            "amount": amount,
            "timestamp": t_time.isoformat(),
            "latitude": round(z["latitude"] + random.uniform(-0.005, 0.005), 6),
            "longitude": round(z["longitude"] + random.uniform(-0.005, 0.005), 6),
            "atm_id": selected_atm if is_withdrawal else None,
            "bank": random.choice(BANKS),
            "district": z["district"],
            "state": z["state"],
            "device_id": f"DEV-{random.randint(100, 450):03d}",
            "phone_id": f"PH-{random.randint(500, 950):03d}",
            "risk_indicator": risk_ind,
            "ground_truth_suspicious": is_suspicious_gt,
            "zone_id": z["zone_id"]
        })
        tx_id += 1

    # 6. Cases (520 Cases)
    cases = []
    for i in range(1, 521):
        hub = random.choice(HUBS)
        cases.append({
            "case_reference": f"CASE-2026-{i:04d}",
            "category": random.choice(COMPLAINT_CATEGORIES),
            "priority": random.choice(["CRITICAL", "HIGH", "HIGH", "MEDIUM", "LOW"]),
            "status": random.choice(["OPEN", "UNDER_INVESTIGATION", "UNDER_INVESTIGATION", "ESCALATED", "RESOLVED"]),
            "jurisdiction": hub["state"],
            "assigned_agency": f"{hub['state']} Cyber Crime Police",
            "assigned_officer": f"Inspector {random.choice(['Sharma', 'Verma', 'Singh', 'Patel', 'Reddy', 'Chatterjee', 'Deshmukh', 'Menon'])}"
        })

    # 7. Relationships (5,200 Graph Edges)
    relationships = []
    rel_types = ["OWNS", "USES", "CONNECTED_TO", "TRANSFERRED_TO", "WITHDREW_AT", "LOCATED_AT", "LINKED_TO", "PART_OF"]
    for i in range(1, 5201):
        r_type = random.choice(rel_types)
        if r_type == "TRANSFERRED_TO":
            s_type, s_id = "ACCOUNT", f"ACC-SYNTH-{random.randint(1, 250):04d}"
            t_type, t_id = "ACCOUNT", f"ACC-SYNTH-{random.randint(1, 500):04d}"
        elif r_type == "WITHDREW_AT":
            s_type, s_id = "ACCOUNT", f"ACC-SYNTH-{random.randint(1, 250):04d}"
            t_type, t_id = "ATM", f"ATM-{random.randint(1, 500):04d}"
        elif r_type == "USES":
            s_type, s_id = "PERSON", f"PER-SUSPECT-{random.randint(1, 80):03d}"
            t_type, t_id = "PHONE", f"PH-{random.randint(500, 750):03d}"
        elif r_type == "OWNS":
            s_type, s_id = "PERSON", f"PER-SUSPECT-{random.randint(1, 80):03d}"
            t_type, t_id = "ACCOUNT", f"ACC-SYNTH-{random.randint(1, 250):04d}"
        else:
            s_type, s_id = "CASE", f"CASE-2026-{random.randint(1, 200):04d}"
            t_type, t_id = "ACCOUNT", f"ACC-SYNTH-{random.randint(1, 250):04d}"

        relationships.append({
            "source_entity_type": s_type,
            "source_entity_id": s_id,
            "target_entity_type": t_type,
            "target_entity_id": t_id,
            "relationship_type": r_type,
            "weight": round(random.uniform(0.5, 3.0), 2)
        })

    # Save to disk
    dataset = {
        "zones": zones,
        "atms": atms,
        "accounts": accounts,
        "complaints": complaints,
        "transactions": transactions,
        "cases": cases,
        "relationships": relationships
    }

    for key, data in dataset.items():
        filepath = os.path.join(OUTPUT_DIR, f"{key}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Saved {len(data):,} records to {filepath}")

    print("\nDataset generation completed successfully!")
    return dataset

if __name__ == "__main__":
    generate_all_synthetic_data()
