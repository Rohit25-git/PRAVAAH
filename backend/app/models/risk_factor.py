from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from backend.app.database.session import Base

class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False, index=True)
    factor_name = Column(String(100), nullable=False)
    contribution = Column(Float, nullable=False)  # 0 to 100
    explanation = Column(Text, nullable=False)
