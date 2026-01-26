
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath("backend"))

try:
    from app.main import app
    from app.database import Base, engine
    from app.routers import burnout
    print("Imports successful")
    
    # Try to create tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized successful")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
