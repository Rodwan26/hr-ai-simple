from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    requirements = Column(Text)  # Legacy field, kept for backward compatibility
    
    # New structured fields for HR feedback compliance
    roles_responsibilities = Column(Text, nullable=True)  # What the job duties entail
    desired_responsibilities = Column(Text, nullable=True)  # Additional responsibilities
    candidate_profile = Column(JSON, nullable=True)  # {education, experience, required_skills}
    
    department = Column(String, index=True, nullable=True)
    location = Column(String, nullable=True)
    employment_type = Column(String, nullable=True) # Full-time, Part-time, Contract, etc.
    experience_level = Column(String, nullable=True) # Junior, Mid, Senior, Lead
    required_skills = Column(JSON, nullable=True) # List of strings (legacy, use candidate_profile instead)
    is_active = Column(Boolean, default=True, nullable=False)

    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    organization = relationship("Organization", back_populates="jobs")

    resumes = relationship("Resume", back_populates="job", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job", cascade="all, delete-orphan")
