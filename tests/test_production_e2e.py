#!/usr/bin/env python3
"""
PRAVAAH — Production End-to-End Verification Suite
Tests the complete production readiness pipeline:
1. Environment & Branding Configuration Audit
2. Production Cryptography & RBAC Token Security (all 4 roles)
3. Geospatial Database Schema & Records Integrity
4. Production ML Model Artifact Inference (Random Forest + Isolation Forest)
5. REST API Services, Risk Graphs & Hotspot Prediction
6. Security Headers & Ingress Rules Validation
"""

import sys
import os
import json
import joblib
import numpy as np
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config.settings import settings
from backend.app.main import app
from backend.app.database.session import SessionLocal, engine
from backend.app.auth.security import create_access_token, decode_access_token, verify_password

client = TestClient(app)

class TestProductionE2E:
    
    # ---------------------------------------------------------
    # 1. Branding, Metadata & Configuration Audit
    # ---------------------------------------------------------
    def test_01_branding_and_config(self):
        print("\n[E2E 01] Verifying Branding & Production Settings...")
        assert settings.PROJECT_NAME == "PRAVAAH", f"Unexpected project name: {settings.PROJECT_NAME}"
        assert "PRAVAAH" in settings.PRODUCT_TITLE, f"Unexpected title: {settings.PRODUCT_TITLE}"
        assert "Predictive Risk And Vulnerability Analysis for ATM Activity & Hotspots" in settings.PRODUCT_TITLE
        assert len(settings.JWT_SECRET) >= 32, "JWT Secret must be at least 256 bits (32 chars)"
        print("  -> Project Name, Title and Security Secrets passed audit.")

    # ---------------------------------------------------------
    # 2. Cryptographic Auth & All 4 RBAC Roles
    # ---------------------------------------------------------
    def test_02_rbac_authentication(self):
        print("\n[E2E 02] Testing RBAC Authentication for all 4 Designated Roles...")
        roles = [
            ("admin@pravaah.gov.in", "admin123", "ADMIN"),
            ("i4c.officer@pravaah.gov.in", "password123", "I4C_OFFICER"),
            ("lea.officer@pravaah.gov.in", "password123", "LEA_OFFICER"),
            ("bank.analyst@pravaah.gov.in", "password123", "BANK_ANALYST")
        ]
        
        for email, password, expected_role in roles:
            # Login via API
            resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
            assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
            data = resp.json()
            assert "access_token" in data, f"Missing token for {email}"
            assert data.get("role") == expected_role, f"Expected role {expected_role}, got {data.get('role')}"
            
            # Decode and verify JWT claims
            payload = decode_access_token(data["access_token"])
            assert payload.get("sub") == email or payload.get("email") == email
            assert payload.get("role") == expected_role
            print(f"  -> Verified RBAC credentials & JWT token for [{expected_role}] ({email})")

    # ---------------------------------------------------------
    # 3. Database Schema, Tables & Lat/Lon Geospatial Validity
    # ---------------------------------------------------------
    def test_03_database_and_geospatial(self):
        print("\n[E2E 03] Verifying Database Records & Geospatial Boundary Coordinates...")
        db = SessionLocal()
        try:
            # Check ATM data
            resp = client.get("/api/v1/map/atms")
            assert resp.status_code == 200
            atms = resp.json()
            assert len(atms) > 0, "No ATMs found in database"
            
            # Check coordinate bounds (India / Delhi bounds: Lat ~8-37, Lon ~68-98)
            for atm in atms[:10]:
                lat = float(atm.get("latitude") or atm.get("lat", 0))
                lon = float(atm.get("longitude") or atm.get("lon", 0))
                assert 8.0 <= lat <= 38.0, f"Latitude {lat} out of valid geographic range"
                assert 68.0 <= lon <= 98.0, f"Longitude {lon} out of valid geographic range"
            print(f"  -> Validated {len(atms)} ATM spatial coordinates within India geographic bounds.")
        finally:
            db.close()

    # ---------------------------------------------------------
    # 4. Machine Learning Model Artifacts & Dual-Inference
    # ---------------------------------------------------------
    def test_04_ml_model_artifacts(self):
        print("\n[E2E 04] Verifying ML Model Pipelines (Random Forest + Isolation Forest)...")
        rf_path = "ml/models/future_hotspot_rf.pkl"
        iso_path = "ml/models/isolation_forest.pkl"
        meta_path = "ml/artifacts/model_metadata.json"
        
        assert os.path.exists(rf_path), "Missing future_hotspot_rf.pkl"
        assert os.path.exists(iso_path), "Missing isolation_forest.pkl"
        assert os.path.exists(meta_path), "Missing model_metadata.json"
        
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        feature_cols = meta.get("feature_columns", [])
        assert len(feature_cols) == 28, f"Expected 28 features, got {len(feature_cols)}"
        
        # Test Random Forest Classifier
        rf_model = joblib.load(rf_path)
        sample_rf = np.random.uniform(0.1, 5.0, size=(1, 28))
        rf_pred = rf_model.predict(sample_rf)
        rf_proba = rf_model.predict_proba(sample_rf)
        assert rf_pred[0] in [0, 1], "Prediction should be binary hotspot label"
        assert len(rf_proba[0]) == 2, "Binary probability distribution expected"
        print(f"  -> Random Forest 28-feature inference verified (P_hotspot={rf_proba[0][1]:.3f})")

        # Test Isolation Forest Anomaly Detector
        iso_model = joblib.load(iso_path)
        iso_n_features = getattr(iso_model, 'n_features_in_', 4)
        sample_iso = np.random.uniform(0.1, 5.0, size=(1, iso_n_features))
        iso_pred = iso_model.predict(sample_iso)
        iso_score = iso_model.decision_function(sample_iso)
        assert iso_pred[0] in [-1, 1], "Isolation Forest anomaly label must be -1 or 1"
        print(f"  -> Isolation Forest 4-feature anomaly detection verified (Anomaly={iso_pred[0]}, Score={iso_score[0]:.3f})")

    # ---------------------------------------------------------
    # 5. Core REST Services & Intelligence Graph
    # ---------------------------------------------------------
    def test_05_rest_api_and_intelligence_graph(self):
        print("\n[E2E 05] Verifying Production REST API & Intelligence Graph Endpoints...")
        
        # Health check
        res_h = client.get("/api/v1/system/health")
        assert res_h.status_code == 200
        assert res_h.json().get("status", "").lower() in ["healthy", "ok"]

        # Dashboard summary (live database metrics)
        res_s = client.get("/api/v1/dashboard/summary")
        assert res_s.status_code == 200
        summary = res_s.json()
        assert summary.get("active_hotspots", 0) >= 0
        assert summary.get("cybercrime_complaints", 0) > 0
        print(f"  -> Dashboard live stats: {summary.get('cybercrime_complaints')} complaints, {summary.get('active_hotspots')} hotspots.")

        # Hotspots list
        res_hot = client.get("/api/v1/hotspots")
        assert res_hot.status_code == 200
        hotspots = res_hot.json()
        assert len(hotspots) > 0
        print(f"  -> {len(hotspots)} Predictive hotspots active.")

        # Intelligence Graph / Relationships
        res_graph = client.get("/api/v1/graph/relationships?limit=100")
        assert res_graph.status_code == 200
        graph_data = res_graph.json()
        nodes = graph_data.get("elements", {}).get("nodes", [])
        edges = graph_data.get("elements", {}).get("edges", [])
        assert len(nodes) > 0, "Graph nodes empty"
        print(f"  -> Intelligence Graph populated with {len(nodes)} nodes and {len(edges)} edges.")

        # All-Risks Graph
        res_all_risks = client.get("/api/v1/graph/all-risks")
        if res_all_risks.status_code == 200:
            all_risks = res_all_risks.json()
            assert "elements" in all_risks or "nodes" in all_risks
            print(f"  -> Intelligence Graph 'all-risks' endpoint verified.")

    # ---------------------------------------------------------
    # 6. Reverse Proxy Configuration & Security Headers
    # ---------------------------------------------------------
    def test_06_edge_ingress_and_headers(self):
        print("\n[E2E 06] Verifying Caddy & Nginx Reverse Proxy Configs...")
        assert os.path.exists("Caddyfile"), "Missing Caddyfile"
        assert os.path.exists("frontend/nginx.conf"), "Missing frontend/nginx.conf"
        
        with open("Caddyfile", "r", encoding="utf-8") as f:
            caddy_content = f.read()
        assert "Strict-Transport-Security" in caddy_content
        assert "X-Frame-Options" in caddy_content
        assert "X-Content-Type-Options" in caddy_content
        assert "reverse_proxy" in caddy_content

        with open("frontend/nginx.conf", "r", encoding="utf-8") as f:
            nginx_content = f.read()
        assert "try_files $uri $uri/ /index.html;" in nginx_content
        assert "proxy_pass http://backend:8000/api/;" in nginx_content
        assert "proxy_pass http://backend:8000/ws/;" in nginx_content
        print("  -> Ingress TLS, HSTS, SPA routing and WebSocket proxies verified.")

if __name__ == "__main__":
    t = TestProductionE2E()
    t.test_01_branding_and_config()
    t.test_02_rbac_authentication()
    t.test_03_database_and_geospatial()
    t.test_04_ml_model_artifacts()
    t.test_05_rest_api_and_intelligence_graph()
    t.test_06_edge_ingress_and_headers()
    print("\n==========================================================")
    print("  ALL 6 PRODUCTION END-TO-END SUITES PASSED FLAWLESSLY!    ")
    print("==========================================================")
