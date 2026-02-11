"""
Phase 1 Hardening Migration
Creates tasks table and updates resumes table for reliability tracking.
"""
import sqlite3
import sys
import os

def migrate_hardening(db_path="database.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("=" * 60)
    print("Phase 1 Hardening Migration")
    print("=" * 60)
    
    try:
        # 1. Create tasks table
        print("\n[1/2] Creating tasks table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type VARCHAR NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'PENDING',
            payload JSON NOT NULL,
            result JSON,
            error TEXT,
            retries INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            next_retry_at DATETIME,
            organization_id INTEGER,
            FOREIGN KEY(organization_id) REFERENCES organizations(id)
        );
        """)
        # Specific index creation for status to speed up polling
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks (status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_tasks_type ON tasks (type);")
        print("  ✓ Tasks table created")
        
        # 2. Update resumes table
        print("\n[2/2] Updating resumes table...")
        cursor.execute("PRAGMA table_info(resumes)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'anonymization_status' not in columns:
            print("  - Adding anonymization_status column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN anonymization_status VARCHAR DEFAULT 'PENDING' NOT NULL")
        else:
            print("  - anonymization_status column already exists")
            
        conn.commit()
        print("\n" + "=" * 60)
        print("✓ Hardening migration completed successfully!")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration on backend database...")
    success1 = migrate_hardening("database.db")
    
    print("\nRunning migration on root database...")
    success2 = migrate_hardening("../database.db")
    
    if success1 or success2:
        sys.exit(0)
    else:
        sys.exit(1)
