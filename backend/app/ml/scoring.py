from typing import Dict, Any, Tuple
from backend.app.config.settings import settings

class RiskScoringEngine:
    def __init__(self):
        self.w_anomaly = settings.WEIGHT_TRANSACTION_ANOMALY
        self.w_crime = settings.WEIGHT_HISTORICAL_CRIME
        self.w_geo = settings.WEIGHT_GEOGRAPHIC_CONCENTRATION
        self.w_temporal = settings.WEIGHT_TEMPORAL_PATTERN
        self.w_network = settings.WEIGHT_NETWORK_INTELLIGENCE

    def compute_risk_factors(
        self,
        transaction_anomaly: float,
        historical_cybercrime: float,
        geographic_concentration: float,
        temporal_pattern: float,
        network_intelligence: float
    ) -> Tuple[float, str, Dict[str, float]]:
        """
        Combines 5 normalized indicators (0-100) into a weighted composite score (0-100)
        and categorizes risk level (LOW, MEDIUM, HIGH, CRITICAL).
        """
        score = (
            self.w_anomaly * transaction_anomaly +
            self.w_crime * historical_cybercrime +
            self.w_geo * geographic_concentration +
            self.w_temporal * temporal_pattern +
            self.w_network * network_intelligence
        )
        score = round(max(0.0, min(100.0, score)), 1)

        if score >= settings.THRESHOLD_CRITICAL_MIN:
            level = "CRITICAL"
        elif score > settings.THRESHOLD_MEDIUM_MAX:
            level = "HIGH"
        elif score > settings.THRESHOLD_LOW_MAX:
            level = "MEDIUM"
        else:
            level = "LOW"

        factors = {
            "transaction_anomaly": round(transaction_anomaly, 1),
            "historical_cybercrime": round(historical_cybercrime, 1),
            "geographic_concentration": round(geographic_concentration, 1),
            "temporal_pattern": round(temporal_pattern, 1),
            "network_intelligence": round(network_intelligence, 1)
        }

        return score, level, factors

    def forecast_predicted_time_window(self, temporal_features: Dict[str, float]) -> str:
        """
        Determines the most probable future cash withdrawal time window:
        00:00–06:00, 06:00–12:00, 12:00–18:00, 18:00–22:00, 22:00–00:00
        """
        hour = temporal_features.get("hour", 19.0)
        if 18.0 <= hour < 22.0 or temporal_features.get("temporal_pattern", 75.0) > 65.0:
            return "18:00–22:00"
        elif 12.0 <= hour < 18.0:
            return "12:00–18:00"
        elif 6.0 <= hour < 12.0:
            return "06:00–12:00"
        elif 22.0 <= hour <= 24.0:
            return "22:00–00:00"
        else:
            return "00:00–06:00"

risk_scoring_engine = RiskScoringEngine()
