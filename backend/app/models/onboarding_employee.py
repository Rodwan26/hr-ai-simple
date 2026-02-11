from sqlalchemy import Column, Integer, String, Date, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class OnboardingStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class OnboardingEmployee(Base):
    __tablename__ = "onboarding_employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String, index=True)
    employee_email = Column(String, index=True)
    position = Column(String, index=True)
    department = Column(String, index=True)
    start_date = Column(Date)
    manager_name = Column(String, nullable=True)
    status = Column(SQLEnum(OnboardingStatus), default=OnboardingStatus.pending, index=True)
    completion_percentage = Column(Integer, default=0)
    estimated_completion_date = Column(Date, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="onboarding_employees")
    tasks = relationship("OnboardingTask", back_populates="employee", cascade="all, delete-orphan")


