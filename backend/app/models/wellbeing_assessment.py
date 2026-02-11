from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class WellbeingAssessment(Base):
    __tablename__ = "wellbeing_assessments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Priority for support check-in: low, medium, priority (formerly risk_level)
    support_priority = Column(String) 
    
    # Friction points or growth opportunities (formerly indicators)
    friction_indicators = Column(JSON) 
    
    # Constructive next steps (formerly recommendations)
    support_recommendations = Column(JSON) 
    
    # Detailed AI analysis context
    wellbeing_analysis = Column(String)
    
    # Trust & Transparency Layer
    trust_metadata = Column(JSON)
    
    assessed_at = Column(DateTime, default=datetime.now)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    employee = relationship("Employee", backref="wellbeing_assessments")
