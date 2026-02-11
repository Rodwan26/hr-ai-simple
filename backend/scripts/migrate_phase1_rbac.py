"""
Migration Script: Phase 1 - Enhanced RBAC & Department Hierarchy

This script:
1. Creates the 'departments' table
2. Adds 'department_id' column to users table
3. Adds new columns to users table (full_name, updated_at)
4. Migrates existing 'department' string values to new Department records
5. Updates UserRole enum with new roles

Run: python scripts/migrate_phase1_rbac.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.organization import Organization

def run_migration():
    print("=" * 60)
    print("Phase 1 Migration: Enhanced RBAC & Department Hierarchy")
    print("=" * 60)
    
    conn = engine.connect()
    inspector = inspect(engine)
    
    # Step 1: Create departments table if not exists
    print("\n[Step 1] Creating departments table...")
    if "departments" not in inspector.get_table_names():
        conn.execute(text("""
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organization_id INTEGER NOT NULL REFERENCES organizations(id),
                name VARCHAR NOT NULL,
                code VARCHAR NOT NULL,
                description TEXT,
                parent_id INTEGER REFERENCES departments(id),
                manager_user_id INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX ix_departments_organization_id ON departments(organization_id)"))
        conn.execute(text("CREATE INDEX ix_departments_name ON departments(name)"))
        conn.execute(text("CREATE INDEX ix_departments_code ON departments(code)"))
        print("  ✓ departments table created")
    else:
        print("  - departments table already exists")
    
    # Step 2: Add columns to users table
    print("\n[Step 2] Adding new columns to users table...")
    
    existing_columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'department_id' not in existing_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)"))
        print("  ✓ department_id column added")
    else:
        print("  - department_id column already exists")
    
    if 'full_name' not in existing_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
        print("  ✓ full_name column added")
    else:
        print("  - full_name column already exists")
    
    if 'updated_at' not in existing_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP"))
        print("  ✓ updated_at column added")
    else:
        print("  - updated_at column already exists")
    
    # Step 3: Add columns to user_sessions table
    print("\n[Step 3] Adding metadata columns to user_sessions table...")
    
    session_columns = [col['name'] for col in inspector.get_columns('user_sessions')]
    
    if 'user_agent' not in session_columns:
        conn.execute(text("ALTER TABLE user_sessions ADD COLUMN user_agent VARCHAR"))
        print("  ✓ user_agent column added")
    else:
        print("  - user_agent column already exists")
    
    if 'ip_address' not in session_columns:
        conn.execute(text("ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR"))
        print("  ✓ ip_address column added")
    else:
        print("  - ip_address column already exists")
    
    conn.commit()
    conn.close()
    
    # Step 4: Migrate existing department strings to Department records
    print("\n[Step 4] Migrating existing department strings...")
    
    db = SessionLocal()
    try:
        # Get all organizations
        orgs = db.execute(text("SELECT id FROM organizations")).fetchall()
        
        for org in orgs:
            org_id = org[0]
            
            # Get unique department strings from users
            dept_strings = db.execute(text("""
                SELECT DISTINCT department 
                FROM users 
                WHERE organization_id = :org_id 
                AND department IS NOT NULL 
                AND department != ''
            """), {"org_id": org_id}).fetchall()
            
            for (dept_name,) in dept_strings:
                # Check if department already exists
                existing = db.query(Department).filter(
                    Department.organization_id == org_id,
                    Department.name == dept_name
                ).first()
                
                if not existing:
                    # Create department code from name
                    code = dept_name.upper().replace(" ", "_")[:20]
                    
                    # Create new department
                    new_dept = Department(
                        organization_id=org_id,
                        name=dept_name,
                        code=code,
                        is_active=True
                    )
                    db.add(new_dept)
                    db.flush()
                    
                    # Update users with this department string
                    db.execute(text("""
                        UPDATE users 
                        SET department_id = :dept_id 
                        WHERE organization_id = :org_id 
                        AND department = :dept_name
                    """), {"dept_id": new_dept.id, "org_id": org_id, "dept_name": dept_name})
                    
                    print(f"  ✓ Created department '{dept_name}' (code: {code}) and linked users")
                else:
                    # Link users to existing department
                    db.execute(text("""
                        UPDATE users 
                        SET department_id = :dept_id 
                        WHERE organization_id = :org_id 
                        AND department = :dept_name
                        AND department_id IS NULL
                    """), {"dept_id": existing.id, "org_id": org_id, "dept_name": dept_name})
                    print(f"  - Department '{dept_name}' already exists, linked remaining users")
        
        db.commit()
        print("  ✓ Migration complete")
        
    except Exception as e:
        db.rollback()
        print(f"  ✗ Error during migration: {e}")
        raise
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)
    
    print("\nNew UserRoles available:")
    for role in UserRole:
        print(f"  - {role.value}")
    
    print("\nNext steps:")
    print("1. Restart the backend server")
    print("2. Create departments via /api/departments endpoint")
    print("3. Assign users to departments via admin panel")


if __name__ == "__main__":
    run_migration()
