from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class OnboardingDocument(Base):
    __tablename__ = "onboarding_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("onboarding_employees.id"))
    document_name = Column(String)
    document_type = Column(String) # contract, handbook, id_proof, etc.
    is_signed = Column(Boolean, default=False)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    file_path = Column(String, nullable=True)
    required_by = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
