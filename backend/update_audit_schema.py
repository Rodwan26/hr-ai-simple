from app.database import engine, Base
from sqlalchemy import text

def add_audit_columns():
    with engine.connect() as conn:
        try:
            # Check if columns exist
            result = conn.execute(text("PRAGMA table_info(audit_logs)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'before_state' not in columns:
                print("Adding before_state column...")
                # SQLite doesn't support JSON type natively in ALTER TABLE, treat as TEXT/JSON
                # SQLAlchemy handles JSON type abstraction, but raw SQL needs generic type
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN before_state JSON"))
            else:
                print("before_state column already exists.")

            if 'after_state' not in columns:
                print("Adding after_state column...")
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN after_state JSON"))
            else:
                print("after_state column already exists.")
                
            print("Audit log schema updated successfully.")
        except Exception as e:
            print(f"Error updating schema: {e}")

if __name__ == "__main__":
    add_audit_columns()
