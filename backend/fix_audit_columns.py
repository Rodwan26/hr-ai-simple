"""Direct fix for missing audit_logs columns."""
import sqlite3
import os

# Correct absolute path to the database
db_path = os.path.join(os.path.dirname(__file__), "database.db")
print(f"Using database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(audit_logs)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns: {columns}")

# Add missing columns
if 'before_state' not in columns:
    print("Adding before_state column...")
    cursor.execute("ALTER TABLE audit_logs ADD COLUMN before_state TEXT")
else:
    print("before_state already exists.")

if 'after_state' not in columns:
    print("Adding after_state column...")
    cursor.execute("ALTER TABLE audit_logs ADD COLUMN after_state TEXT")
else:
    print("after_state already exists.")

conn.commit()
conn.close()
print("Done! Restart your backend server.")
