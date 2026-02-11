from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AIModelRegistry(Base):
    __tablename__ = "ai_model_registry"
    
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, index=True) # e.g., "resume", "interview"
    version = Column(String) # e.g., "1.0.0"
    model_name = Column(String) # e.g., "gpt-4", "gemini-pro"
    prompt_template = Column(String)
    parameters = Column(JSON) # e.g., {"temperature": 0.7}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EthicalAuditLog(Base):
    __tablename__ = "ethical_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    domain = Column(String, index=True)
    
    # Provenance
    request_id = Column(String, index=True)
    model_version_id = Column(Integer, ForeignKey("ai_model_registry.id"))
    input_data_summary = Column(JSON) # Summary of inputs used for decision
    output_data = Column(JSON) # The actual AI response
    
    # Ethical Metrics
    confidence_score = Column(Float)
    bias_score = Column(Float, default=0.0) # 0 to 1, where 1 is highly biased detection
    flagged_for_review = Column(Boolean, default=False)
    ethical_checks = Column(JSON) # e.g., {"toxicity": 0.1, "fairness": 0.9}
    
    # Review
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(String, nullable=True)
    review_status = Column(String, default="pending") # pending, approved, rejected
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization")
    model_version = relationship("AIModelRegistry")
    reviewer = relationship("User")
