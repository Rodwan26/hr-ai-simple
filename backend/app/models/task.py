from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Task(Base):
    """
    Represents a persistent background task.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True, nullable=False)  # e.g., "resume_analysis"
    status = Column(String, index=True, default="PENDING", nullable=False)  # PENDING, PROCESSING, COMPLETED, FAILED, RETRYING
    
    payload = Column(JSON, nullable=False)  # Input arguments for the task
    result = Column(JSON, nullable=True)    # Output or partial results
    error = Column(Text, nullable=True)     # Error message if failed
    
    retries = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    next_retry_at = Column(DateTime, nullable=True)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "error": self.error
        }
