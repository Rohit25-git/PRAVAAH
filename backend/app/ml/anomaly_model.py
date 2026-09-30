import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MODEL_DIR = "ml/models"
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")

class AnomalyModel:
    def __init__(self):
        self.model: IsolationForest = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                return
            except Exception:
                pass
        
        # Fit calibrated baseline Isolation Forest
        self.model = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
        baseline = np.column_stack([
            np.random.normal(4500, 2000, 1000),  # amount
            np.random.randint(0, 24, 1000),      # hour
            np.random.choice([0, 1], 1000),      # is_atm
            np.random.exponential(1.0, 1000)     # velocity
        ])
        self.model.fit(baseline)
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def score_transactions(self, feature_df: pd.DataFrame) -> np.ndarray:
        if feature_df.empty:
            return np.array([])
        
        cols = ["amount", "hour", "is_atm", "velocity"]
        for c in cols:
            if c not in feature_df.columns:
                feature_df[c] = 0.0

        X = feature_df[cols].values
        # Negative decision function is anomalous
        raw = -self.model.decision_function(X)
        # Normalize into [0, 100]
        norm = np.clip((raw - (-0.15)) / (0.35 - (-0.15)) * 100.0, 0.0, 100.0)
        return np.round(norm, 2)

anomaly_model = AnomalyModel()
