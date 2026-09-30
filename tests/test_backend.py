import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200

def test_system_health():
    res = client.get("/api/v1/system/health")
    assert res.status_code == 200

def test_dashboard_summary():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    d = res.json()
    assert d["cybercrime_complaints"] >= 1000

def test_predictions():
    res = client.get("/api/v1/predictions")
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_hotspots():
    res = client.get("/api/v1/hotspots")
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_map_endpoints():
    r1 = client.get("/api/v1/map/risk-zones")
    r2 = client.get("/api/v1/map/atms")
    r3 = client.get("/api/v1/map/withdrawals")
    r4 = client.get("/api/v1/map/complaints")
    assert all(r.status_code == 200 for r in [r1, r2, r3, r4])

def test_transactions():
    res = client.get("/api/v1/transactions?limit=10")
    assert res.status_code == 200
    assert res.json()["total"] >= 10000

def test_alerts():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200

def test_graph_relationships():
    res = client.get("/api/v1/graph/relationships?limit=50")
    assert res.status_code == 200
    assert len(res.json()["elements"]["nodes"]) > 0

def test_ai_risk_explainability():
    res = client.post("/api/v1/ai/explain-risk", json={})
    assert res.status_code == 200
    exp = res.json()
    assert "what" in exp and "why" in exp

def test_reports_generation():
    res = client.post("/api/v1/reports/generate", json={})
    assert res.status_code == 200
    assert "report_id" in res.json()

def test_simulation_trigger():
    res = client.post("/api/v1/simulation/trigger?district=Central%20Delhi")
    assert res.status_code == 200
    assert res.json()["status"] == "success"

if __name__ == "__main__":
    test_health()
    test_system_health()
    test_dashboard_summary()
    test_predictions()
    test_hotspots()
    test_map_endpoints()
    test_transactions()
    test_alerts()
    test_graph_relationships()
    test_ai_risk_explainability()
    test_reports_generation()
    test_simulation_trigger()
    print("ALL 12 TESTS PASSED INDIVIDUALLY AND TOGETHER!")
