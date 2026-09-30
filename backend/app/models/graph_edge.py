from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.app.database import Base

class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String(100), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # PERSON, ACCOUNT, PHONE, DEVICE, ATM, LOCATION, ORGANIZATION, CASE
    source_label = Column(String(255), nullable=False)
    
    target_id = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_label = Column(String(255), nullable=False)
    
    relationship = Column(String(50), nullable=False, index=True)  # OWNS, USES, CONNECTED_TO, TRANSFERRED_TO, WITHDREW_AT, LOCATED_AT, LINKED_TO, PART_OF
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
