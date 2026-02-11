from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True) # Linked auth account
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    position = Column(String, nullable=True)
    
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="employee_profile")
    organization = relationship("Organization", back_populates="employees")
