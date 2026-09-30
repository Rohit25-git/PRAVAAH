#!/usr/bin/env python3
"""
PRAVAAH ML Artifacts Verification Script
Validates model integrity, feature alignment, and inference stability for:
- future_hotspot_rf.pkl (Random Forest Supervised Classifier)
- isolation_forest.pkl (Unsupervised Geospatial Anomaly Detector)
- model_metadata.json (Model Governance & Explainability Weights)
"""

import os
import sys
import json
import joblib
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def verify_ml():
    print("==========================================================")
    print("  PRAVAAH — Machine Learning Model Artifacts Audit")
    print("==========================================================")

    model_dir = "ml/models"
    artifact_dir = "ml/artifacts"

    rf_path = os.path.join(model_dir, "future_hotspot_rf.pkl")
    iso_path = os.path.join(model_dir, "isolation_forest.pkl")
    meta_path = os.path.join(artifact_dir, "model_metadata.json")

    # 1. Verify existence
    assert os.path.exists(rf_path), f"Missing Random Forest model: {rf_path}"
    assert os.path.exists(iso_path), f"Missing Isolation Forest model: {iso_path}"
    assert os.path.exists(meta_path), f"Missing Model Metadata: {meta_path}"
    print("[PASS] All ML artifact files present on disk.")

    # 2. Verify Metadata & Features
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    
    feature_cols = meta.get("feature_columns", [])
    print(f"[PASS] Model metadata loaded. Version: {meta.get('model_version')}, Features: {len(feature_cols)}")
    assert len(feature_cols) >= 20, "Feature columns specification incomplete"

    # 3. Verify Random Forest Classifier
    rf_model = joblib.load(rf_path)
    print(f"[PASS] Random Forest loaded: {rf_model.__class__.__name__}, n_estimators={getattr(rf_model, 'n_estimators', 'N/A')}")
    
    # Run test prediction
    sample_features = np.random.uniform(0.1, 10.0, size=(1, len(feature_cols)))
    rf_pred = rf_model.predict(sample_features)
    rf_proba = rf_model.predict_proba(sample_features)
    print(f"[PASS] RF Sample Inference Output: Prediction={rf_pred[0]}, Probability={rf_proba[0].round(4)}")
    assert len(rf_proba[0]) == 2, "Binary probability output expected"

    # 4. Verify Isolation Forest
    iso_model = joblib.load(iso_path)
    iso_n_features = getattr(iso_model, 'n_features_in_', 4)
    print(f"[PASS] Isolation Forest loaded: {iso_model.__class__.__name__}, Expected Features: {iso_n_features}")
    iso_sample = np.random.uniform(0.1, 10.0, size=(1, iso_n_features))
    iso_pred = iso_model.predict(iso_sample)
    iso_score = iso_model.decision_function(iso_sample)
    print(f"[PASS] Isolation Forest Output: Anomaly Flag={iso_pred[0]}, Score={iso_score[0]:.4f}")

    print("\n[SUCCESS] All Machine Learning Model Artifacts Verified for Production Ingestion!")
    return True

if __name__ == "__main__":
    verify_ml()
