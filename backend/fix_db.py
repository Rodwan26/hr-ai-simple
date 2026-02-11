import sys
import os

# Ensure the current directory is in the path so imports work
sys.path.append(os.getcwd())

from app.database import engine, Base
from app.models import (
    user, organization, audit_log
)

def fix_database():
    print("Beginning database schema fix...")
    
    # 1. Inspect existing tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Existing tables: {existing_tables}")
    
    # 2. Force import all models to ensure they are in Base.metadata
    print("Registering models...")
    # Add any other models you suspect are missing from init logic
    # The 'user' module contains User and UserSession
    
    # 3. Create missing tables
    print("Creating missing tables...")
    Base.metadata.create_all(bind=engine)
    
    # 4. Verify 'user_sessions'
    inspector = inspect(engine)
    new_tables = inspector.get_table_names()
    if "user_sessions" in new_tables:
        print("SUCCESS: 'user_sessions' table exists.")
    else:
        print("ERROR: 'user_sessions' table was NOT created.")
        
    print("Database fix complete.")

if __name__ == "__main__":
    fix_database()
