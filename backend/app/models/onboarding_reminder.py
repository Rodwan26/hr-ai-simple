from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class ReminderType(str, enum.Enum):
    EMAIL = "EMAIL"
    SLACK = "SLACK"
    IN_APP = "IN_APP"

class ReminderStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class OnboardingReminder(Base):
    __tablename__ = "onboarding_reminders"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("onboarding_tasks.id"), index=True, nullable=False)
    reminder_type = Column(SQLEnum(ReminderType), default=ReminderType.EMAIL)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(ReminderStatus), default=ReminderStatus.PENDING)

    # Relationships
    task = relationship("OnboardingTask", back_populates="reminders")
