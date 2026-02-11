import sqlite3
import os

db_path = "database.db"

def migrate():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Fix audit_logs
    columns_to_add = [
        ("before_state", "TEXT"),  # Use TEXT for JSON in SQLite
        ("after_state", "TEXT"),
        ("organization_id", "INTEGER")
    ]

    # Check existing columns
    cursor.execute("PRAGMA table_info(audit_logs)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} to audit_logs...")
            cursor.execute(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type}")
        else:
            print(f"Column {col_name} already exists in audit_logs.")

    # 2. Ensure user_sessions exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_revoked BOOLEAN DEFAULT 0 NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    print("Checked/Created user_sessions table.")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
