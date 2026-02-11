"""Schema migration script to add version column to documents table."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "database.db")
print(f"Using database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if column exists
cursor.execute("PRAGMA table_info(documents)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Current columns: {columns}")

if 'version' not in columns:
    print("Adding version column...")
    cursor.execute("ALTER TABLE documents ADD COLUMN version TEXT DEFAULT '1.0'")
    conn.commit()
    print("Done!")
else:
    print("version column already exists.")

conn.close()
