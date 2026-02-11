import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    print(f"Migrating database (Payroll Locks) at {settings.database_url}...")
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        try:
            # Create payroll_locks table if not exists (SQLite syntax/Postgres safe mostly)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS payroll_locks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    month INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    locked_by_user_id INTEGER,
                    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    organization_id INTEGER NOT NULL,
                    FOREIGN KEY (organization_id) REFERENCES organizations (id)
                )
            """))
            print("Created 'payroll_locks' table.")
            
            # Add organization_id to payrolls if missing
            try:
                conn.execute(text("ALTER TABLE payrolls ADD COLUMN organization_id INTEGER REFERENCES organizations(id)"))
                print("Added 'organization_id' column to 'payrolls' table.")
            except Exception as e:
                # Likely exists or SQLite limitation
                pass

        except Exception as e:
            print(f"Error during migration: {e}")

        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
