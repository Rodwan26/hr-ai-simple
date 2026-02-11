from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSED = "processed"
    PAID = "paid"

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True)
    month = Column(Integer)
    year = Column(Integer)
    base_salary = Column(Float)
    bonuses = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float)
    payment_date = Column(DateTime, nullable=True)
    status = Column(String, default=PayrollStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True) # Ensure multi-tenancy

    components = relationship("SalaryComponent", back_populates="payroll", cascade="all, delete-orphan")

class PayrollLock(Base):
    __tablename__ = "payroll_locks"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    locked_by_user_id = Column(Integer, nullable=True)
    locked_at = Column(DateTime(timezone=True), server_default=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Unique constraint typically: (month, year, organization_id)
    # But for now, we just check existence.
