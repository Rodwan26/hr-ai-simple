"""
Interview Models - Complete Workflow
Includes Interview, Slots, Scorecards, and Kits.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Boolean, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class InterviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DECISION_PENDING = "DECISION_PENDING"
    HIRED = "HIRED"
    REJECTED = "REJECTED"


class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True, index=True)
    
    # Candidate info
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If candidate is a user
    candidate_name = Column(String, index=True)
    candidate_email = Column(String, index=True)
    
    # Interviewer info (primary)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    interviewer_name = Column(String, nullable=True) # Legacy/Fallback
    interviewer_email = Column(String, nullable=True) # Legacy/Fallback
    
    # Scheduling
    preferred_dates = Column(Text, nullable=True) # JSON or text
    scheduled_date = Column(DateTime, nullable=True)
    meeting_link = Column(String, nullable=True)
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.PENDING, index=True)
    
    # Workflow
    stage = Column(String, default="Screening") # Screening, Technical, Cultural, Final
    ai_suggestion = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="interviews")
    job = relationship("Job", back_populates="interviews")
    slots = relationship("InterviewSlot", back_populates="interview", cascade="all, delete-orphan")
    scorecards = relationship("InterviewScorecard", back_populates="interview", cascade="all, delete-orphan")
    kit = relationship("InterviewKit", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewSlotStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    SELECTED = "SELECTED"
    CONFIRMED = "CONFIRMED"


class InterviewSlot(Base):
    __tablename__ = "interview_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)
    meeting_link = Column(String, nullable=True)
    
    status = Column(SQLEnum(InterviewSlotStatus), default=InterviewSlotStatus.AVAILABLE)
    candidate_confirmed = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="slots")
    interviewer = relationship("User", foreign_keys=[interviewer_id])


class ScorecardRecommendation(str, enum.Enum):
    STRONG_YES = "STRONG_YES"
    YES = "YES"
    NO = "NO"
    STRONG_NO = "STRONG_NO"


class InterviewScorecard(Base):
    __tablename__ = "interview_scorecards"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Quantifiable metrics
    overall_rating = Column(Integer, nullable=False) # 1-5
    technical_score = Column(Integer, nullable=True) # 1-10 or 1-5
    communication_score = Column(Integer, nullable=True)
    cultural_fit_score = Column(Integer, nullable=True)
    
    # Qualitative feedback
    strengths = Column(JSON, nullable=True) # List of strings
    concerns = Column(JSON, nullable=True) # List of strings
    feedback_text = Column(Text, nullable=True)
    
    recommendation = Column(SQLEnum(ScorecardRecommendation), nullable=False)
    
    # AI Analysis
    ai_consistency_check = Column(JSON, nullable=True) # AI analysis of feedback consistency/bias
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="scorecards")
    interviewer = relationship("User", foreign_keys=[interviewer_id])


# Keeping InterviewKit here for cohesion, updating if needed
class InterviewKit(Base):
    __tablename__ = "interview_kits_v2" # v2 to distinguish from old model if migration is tricky
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    
    questions = Column(JSON)  # List of {id, text, type, criteria}
    evaluation_guide = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    interview = relationship("Interview", back_populates="kit")
