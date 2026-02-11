from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Per-organization limits (AI usage, storage, etc.)
    usage_limits = Column(JSON, nullable=True, default={
        "ai_calls_per_month": 1000,
        "max_documents": 50,
        "max_users": 10
    })
    
    # Custom settings (branding, locale, etc.)
    settings = Column(JSON, nullable=True, default={})
    
    subscription_tier = Column(String, default="free") # free, professional, enterprise
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="organization")
    departments = relationship("Department", back_populates="organization")
    employees = relationship("Employee", back_populates="organization")
    jobs = relationship("Job", back_populates="organization")
    interviews = relationship("Interview", back_populates="organization")
    onboarding_employees = relationship("OnboardingEmployee", back_populates="organization")
    onboarding_templates = relationship("OnboardingTemplate", back_populates="organization")
    # ... more domain relationships can be added
