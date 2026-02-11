from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, index=True) # e.g., "submit_feedback", "delete_document"
    entity_type = Column(String, index=True) # e.g., "interview", "document"
    entity_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    user_role = Column(String)
    details = Column(JSON) # Action-specific metadata
    ai_recommended = Column(Boolean, default=False) # True if the action matched an AI recommendation
    
    # New Compliance Fields
    before_state = Column(JSON, nullable=True) # State before action
    after_state = Column(JSON, nullable=True) # State after action
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    organization_id = Column(Integer, index=True, nullable=True) # Linked to organizations.id
