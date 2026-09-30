import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CYBERSHIELD AI"
    PROJECT_SUBTITLE: str = "Proactive Cyber-Fraud Intelligence & Withdrawal Hotspot Prediction"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "cybershield-super-secure-jwt-secret-key-2026-demo")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cybershield.db")
    
    # Ollama / AI Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # ML Scoring Weights (Default specified in requirements)
    WEIGHT_TRANSACTION_ANOMALY: float = 0.25
    WEIGHT_HISTORICAL_CRIME: float = 0.25
    WEIGHT_GEOGRAPHIC_CONCENTRATION: float = 0.20
    WEIGHT_TEMPORAL_PATTERN: float = 0.15
    WEIGHT_GRAPH_INTELLIGENCE: float = 0.15
    
    # Risk Score Level Thresholds
    THRESHOLD_LOW_MAX: float = 29.0
    THRESHOLD_MEDIUM_MAX: float = 49.0
    THRESHOLD_HIGH_MAX: float = 69.0
    THRESHOLD_CRITICAL_MIN: float = 70.0

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
