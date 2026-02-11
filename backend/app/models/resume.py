from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    name = Column(String)
    resume_text = Column(Text)
    anonymized_text = Column(Text, nullable=True)
    
    # Legacy scoring (kept for backward compatibility)
    ai_score = Column(Float)
    ai_feedback = Column(Text)
    ai_evidence = Column(JSON, nullable=True)
    
    # New transparent scoring breakdown for HR feedback compliance
    skills_match_score = Column(Float, nullable=True)  # 0-100 score for skills alignment
    seniority_match_score = Column(Float, nullable=True)  # 0-100 score for experience level
    domain_relevance_score = Column(Float, nullable=True)  # 0-100 score for domain expertise
    missing_requirements = Column(JSON, nullable=True)  # Array of missing requirements with explanations
    rejection_reason = Column(Text, nullable=True)  # Structured explanation for rejection (Why Not)
    
    # Bias control
    blind_screening_enabled = Column(Boolean, default=False, nullable=False)
    anonymization_status = Column(String, default="PENDING", nullable=False) # PENDING, SCORED, FAILED, VERIFIED
    
    status = Column(String, default="New", nullable=False) # New, Reviewing, Shortlisted, Rejected
    trust_metadata = Column(JSON, nullable=True)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    job = relationship("Job", back_populates="resumes")
