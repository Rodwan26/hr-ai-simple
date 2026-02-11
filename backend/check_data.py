import sqlite3
import os

DB_FILE = "database.db"

def check_data():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    tables = ["users", "onboarding_employees"]
    
    print(f"--- Checking for NULL organization_id in {DB_FILE} ---")
    
    for table in tables:
        print(f"\nTable: {table}")
        try:
            # Check count of NULL organization_id
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE organization_id IS NULL")
            null_count = cursor.fetchone()[0]
            
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            total_count = cursor.fetchone()[0]
            
            print(f"  Total Rows: {total_count}")
            print(f"  NULL organization_id: {null_count}")
            
            if null_count > 0:
                print("  [!] WARNING: Found records with missing organization_id.")
                
        except Exception as e:
            print(f"  Error inspecting table: {e}")
            
    conn.close()

if __name__ == "__main__":
    check_data()
