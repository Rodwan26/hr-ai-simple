from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Support both PostgreSQL and SQLite via centralized settings
DATABASE_URL = settings.database_url

if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
else:
    # SQLite configuration for local development/testing
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to provide a database session per request.
    Ensures safe session closure after request fulfillment.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Registers all domain models and initializes the database schema.
    This should be called during the application startup lifespan.
    """
    # Import all models to ensure they are registered with Base.metadata before create_all
    from app.models import (
        user, employee, job, resume, interview, 
        user, employee, job, resume, interview, 
        interviewer_availability,
        leave_request, leave_balance, leave_policy, 
        payroll, salary_component, payroll_policy, 
        performance_metric, performance_review, 
        wellbeing_assessment, burnout_assessment,
        onboarding_employee, onboarding_task, onboarding_chat, onboarding_document,
        document, document_chunk, activity,
        audit_log, ticket, organization, governance
    )
    # Perform schema emission
    Base.metadata.create_all(bind=engine)
