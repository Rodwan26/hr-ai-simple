import os
import sqlite3
from app.database import Base, engine, init_db

db_path = "database.db"

def reset():
    print(f"Resetting database at {db_path}...")
    
    # 1. Physically delete db file to ensure clean slate
    if os.path.exists(db_path):
        os.remove(db_path)
        print("✓ Old database file removed.")
    
    # 2. Re-initialize DB tables
    # init_db() creates tables via Base.metadata.create_all(bind=engine)
    init_db()
    print("✓ Tables recreated successfully.")
    print("\nSYSTEM IS NOW IN SETUP MODE.")
    print("You can now use POST /api/setup/initialize to create your organization and admin.")

if __name__ == "__main__":
    reset()
