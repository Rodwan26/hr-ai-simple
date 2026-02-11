from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OnboardingTemplate(Base):
    __tablename__ = "onboarding_templates"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True, nullable=True)
    name = Column(String, index=True, nullable=False)
    tasks = Column(JSON, nullable=False)  # List of {task_name, owner, due_offset_days, description, category}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="onboarding_templates")
    department = relationship("Department", back_populates="onboarding_templates")
