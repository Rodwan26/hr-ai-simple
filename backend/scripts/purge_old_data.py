import os
import sys
from sqlalchemy.orm import Session

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.services.compliance import ComplianceService

def run_retention_policy():
    db = SessionLocal()
    try:
        # Default retention: 365 days (1 year)
        # In a real app, this might be configurable per organization
        result = ComplianceService.enforce_data_retention(db, retention_days=365)
        print(f"Compliance Check Complete: {result}")
    finally:
        db.close()

if __name__ == "__main__":
    run_retention_policy()
