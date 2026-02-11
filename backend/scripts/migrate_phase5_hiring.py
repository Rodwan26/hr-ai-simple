import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    print(f"Migrating database at {settings.database_url}...")
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # 1. Add rejection_reason to resumes
        try:
            conn.execute(text("ALTER TABLE resumes ADD COLUMN rejection_reason TEXT"))
            print("Added 'rejection_reason' column to 'resumes' table.")
        except Exception as e:
            if "duplicate column" in str(e) or "no such table" in str(e):
                print(f"Skipping 'rejection_reason' column addition: {e}")
            else:
                 # SQLite limitation: ALTER TABLE ADD COLUMN might fail if constraints are complex, 
                 # but for nullable TEXT it should work. 
                 # If it fails, we might need to recreate table, but try-catch is good for now.
                 print(f"Error adding column: {e}")

        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
