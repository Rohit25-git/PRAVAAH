from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.app.database.session import Base

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_entity_type = Column(String(50), nullable=False, index=True)  # PERSON, ACCOUNT, PHONE, DEVICE, ATM, LOCATION, CASE, TRANSACTION
    source_entity_id = Column(String(100), nullable=False, index=True)
    target_entity_type = Column(String(50), nullable=False, index=True)
    target_entity_id = Column(String(100), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, index=True)  # OWNS, USES, CONNECTED_TO, TRANSFERRED_TO, WITHDREW_AT, LOCATED_AT, LINKED_TO, PART_OF
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
