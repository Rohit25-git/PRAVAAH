from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from backend.app.database.session import Base

class PredictionRun(Base):
    __tablename__ = "prediction_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), default="v1.4-rf-supervised")
    training_data_version = Column(String(50), default="synthetic-dataset-v1.0")
    feature_version = Column(String(50), default="complaint-driven-v1.2")
    observation_window = Column(String(50), default="Previous 7 Days")
    prediction_horizon = Column(String(50), default="Next 24 Hours")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="COMPLETED", index=True)
    records_scored = Column(Integer, default=0)
    zones_scored = Column(Integer, default=0)
    metrics_json = Column(Text, nullable=True)  # JSON-encoded evaluation metrics (F1, Precision, Recall, AUC)
