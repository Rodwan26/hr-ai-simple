import sqlite3
import os

DB_FILE = "database.db"

def fix_jobs_schema():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        print("--- Fixing Jobs Schema ---")
        
        # Check if description column exists
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [col[1] for col in cursor.fetchall()]
        
        missing_columns = {
            "description": "TEXT DEFAULT NULL",
            "department": "VARCHAR DEFAULT NULL",
            "location": "VARCHAR DEFAULT NULL",
            "employment_type": "VARCHAR DEFAULT NULL",
            "experience_level": "VARCHAR DEFAULT NULL",
            "required_skills": "JSON DEFAULT NULL",
            "is_active": "BOOLEAN DEFAULT 1"
        }

        for col_name, col_def in missing_columns.items():
            if col_name not in columns:
                print(f"Adding '{col_name}' column to 'jobs' table...")
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_def}")
                print(f"Column '{col_name}' added successfully.")
            else:
                 print(f"Column '{col_name}' already exists.")
            
        conn.commit()
        print("--- Fix Complete ---")

    except Exception as e:
        print(f"Error during fix: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_jobs_schema()
