import sqlite3
import os

db_path = "database.db"

def check_db():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    target_tables = ["users", "audit_logs", "user_sessions"]
    for table_name in target_tables:
        print(f"Table: {table_name}")
        cursor.execute(f"PRAGMA table_info({table_name})")
        cols = cursor.fetchall()
        if not cols:
            print("  (Table does not exist)")
        for col in cols:
            print(f"   * {col[1]} ({col[2]})")

    conn.close()

if __name__ == "__main__":
    check_db()
