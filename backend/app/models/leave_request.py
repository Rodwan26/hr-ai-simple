from sqlalchemy import Column, Integer, String, Date, Float, Enum, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    leave_type = Column(String, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float)
    reason = Column(String, nullable=True)
    status = Column(String, default=LeaveStatus.PENDING) 
    conflict_detected = Column(Boolean, default=False)
    ai_decision = Column(String, nullable=True) # "auto_approved", "suggested_approval", "flagged_for_review"
    ai_reasoning = Column(String, nullable=True) # Explanation from AI
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Tenant context
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Approval tracking fields (HR Feedback requirement)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    # Multi-level approval fields
    approval_level = Column(Integer, default=1)
    required_levels = Column(Integer, default=1)
    second_approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    second_approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="leave_requests")
    approver = relationship("User", foreign_keys=[approver_id])
    second_approver = relationship("User", foreign_keys=[second_approver_id])

