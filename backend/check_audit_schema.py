from app.database import engine
from sqlalchemy import text

def inspect_schema():
    with engine.connect() as conn:
        print("Checking audit_logs columns:")
        result = conn.execute(text("PRAGMA table_info(audit_logs)"))
        columns = [row[1] for row in result.fetchall()]
        print(f"Columns found: {columns}")
        
        expected = ['before_state', 'after_state']
        missing = [col for col in expected if col not in columns]
        
        if missing:
            print(f"MISSING COLUMNS: {missing}")
        else:
            print("All AuditLog columns present.")

if __name__ == "__main__":
    inspect_schema()
