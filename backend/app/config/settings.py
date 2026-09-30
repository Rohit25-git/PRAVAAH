import os
import json
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "PRAVAAH"
    PRODUCT_TITLE: str = "PRAVAAH — Predictive Risk And Vulnerability Analysis for ATM Activity & Hotspots"
    OFFICIAL_PROBLEM_STATEMENT: str = (
        "Development of a Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash "
        "Withdrawal Locations in Advance, Enabling Generation of Actionable Intelligence for Timely and Proactive Cybercrime Intervention."
    )
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "pravaah-super-secure-jwt-secret-key-2026-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (PostgreSQL + PostGIS)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://pravaah_admin:PravaahSecure2026!@localhost:5432/pravaah")
    SPATIAL_SRID: int = 4326
    DEFAULT_RADIUS_METERS: float = 3000.0
    
    # Ollama / AI Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    # Groq Cloud AI Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_strip = v.strip()
            if v_strip.startswith("[") and v_strip.endswith("]"):
                try:
                    parsed = json.loads(v_strip)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in v_strip.split(",") if origin.strip()]
        elif isinstance(v, (list, set, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return ["*"]
    
    # Risk Scoring Configuration
    WEIGHT_TRANSACTION_ANOMALY: float = 0.25
    WEIGHT_HISTORICAL_CRIME: float = 0.25
    WEIGHT_GEOGRAPHIC_CONCENTRATION: float = 0.20
    WEIGHT_TEMPORAL_PATTERN: float = 0.15
    WEIGHT_NETWORK_INTELLIGENCE: float = 0.15
    
    # Thresholds
    THRESHOLD_LOW_MAX: float = 29.0
    THRESHOLD_MEDIUM_MAX: float = 49.0
    THRESHOLD_HIGH_MAX: float = 69.0
    THRESHOLD_CRITICAL_MIN: float = 70.0
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
