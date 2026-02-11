import sqlite3
import os

DB_FILE = "database.db"

def fix_data_raw():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        print("--- Fixing NULL organization_id (Raw SQL) ---")
        
        # 1. Get or Create Organization
        cursor.execute("SELECT id, name FROM organizations LIMIT 1")
        row = cursor.fetchone()
        
        org_id = None
        if row:
            org_id = row[0]
            print(f"Using existing Org: {row[1]} (ID: {org_id})")
        else:
            print("Creating Default Organization...")
            # Note: Assuming 'domain' is a column based on fix_user_org.py
            # But let's check columns first or just try inserting essential fields.
            # Organizations usually have 'name'. 'domain' might be there.
            # Safest is to check columns or just try.
            # Let's inspect columns for organizations first.
            cursor.execute("PRAGMA table_info(organizations)")
            cols = [c[1] for c in cursor.fetchall()]
            
            if 'slug' in cols:
                # Use a robust INSERT for minimal required fields
                cursor.execute(
                    """
                    INSERT INTO organizations (name, slug, is_active, subscription_tier, usage_limits, settings) 
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, 
                    ("Default Corp", "default-corp", 1, "free", "{}", "{}")
                )
            elif 'name' in cols:
                 cursor.execute("INSERT INTO organizations (name) VALUES (?)", ("Default Corp",))
            else:
                print("Error: organizations table structure unknown.")
                return

            org_id = cursor.lastrowid
            print(f"Created Org ID: {org_id}")
            
        conn.commit()
            
        if not org_id:
            print("Failed to get Organization ID.")
            return

        # 2. Update Users
        cursor.execute("UPDATE users SET organization_id = ? WHERE organization_id IS NULL", (org_id,))
        print(f"Updated {cursor.rowcount} users.")
        
        # 3. Update Onboarding Employees
        cursor.execute("UPDATE onboarding_employees SET organization_id = ? WHERE organization_id IS NULL", (org_id,))
        print(f"Updated {cursor.rowcount} onboarding employees.")
        
        conn.commit()
        print("--- Fix Complete ---")

    except Exception as e:
        print(f"Error during fix: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_data_raw()
