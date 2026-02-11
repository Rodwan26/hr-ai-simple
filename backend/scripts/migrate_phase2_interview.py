"""
Migration Script: Phase 2 - Interview Workflow

This script:
1. Creates 'interview_slots' table
2. Creates 'interview_scorecards' table
3. Creates 'interview_kits_v2' table
4. Updates 'interviews' table with new columns if missing
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.database import engine

def run_migration():
    print("=" * 60)
    print("Phase 2 Migration: Interview Workflow")
    print("=" * 60)
    
    conn = engine.connect()
    inspector = inspect(engine)
    
    # Step 1: Create interview_slots table
    print("\n[Step 1] Creating interview_slots table...")
    if "interview_slots" not in inspector.get_table_names():
        conn.execute(text("""
            CREATE TABLE interview_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id INTEGER NOT NULL REFERENCES interviews(id),
                interviewer_id INTEGER NOT NULL REFERENCES users(id),
                scheduled_at TIMESTAMP NOT NULL,
                duration_minutes INTEGER DEFAULT 60 NOT NULL,
                meeting_link VARCHAR,
                status VARCHAR DEFAULT 'AVAILABLE',
                candidate_confirmed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX ix_interview_slots_interview_id ON interview_slots(interview_id)"))
        print("  ✓ interview_slots table created")
    else:
        print("  - interview_slots table already exists")

    # Step 2: Create interview_scorecards table
    print("\n[Step 2] Creating interview_scorecards table...")
    if "interview_scorecards" not in inspector.get_table_names():
        conn.execute(text("""
            CREATE TABLE interview_scorecards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id INTEGER NOT NULL REFERENCES interviews(id),
                interviewer_id INTEGER NOT NULL REFERENCES users(id),
                overall_rating INTEGER NOT NULL,
                technical_score INTEGER,
                communication_score INTEGER,
                cultural_fit_score INTEGER,
                strengths JSON,
                concerns JSON,
                feedback_text TEXT,
                recommendation VARCHAR NOT NULL,
                ai_consistency_check JSON,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX ix_interview_scorecards_interview_id ON interview_scorecards(interview_id)"))
        print("  ✓ interview_scorecards table created")
    else:
        print("  - interview_scorecards table already exists")

    # Step 3: Create interview_kits_v2 table
    print("\n[Step 3] Creating interview_kits_v2 table...")
    if "interview_kits_v2" not in inspector.get_table_names():
        conn.execute(text("""
            CREATE TABLE interview_kits_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id INTEGER REFERENCES interviews(id),
                questions JSON,
                evaluation_guide TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("CREATE INDEX ix_interview_kits_v2_interview_id ON interview_kits_v2(interview_id)"))
        print("  ✓ interview_kits_v2 table created")
    else:
        print("  - interview_kits_v2 table already exists")

    # Step 4: Update interviews table
    print("\n[Step 4] Updating interviews table...")
    existing_columns = [col['name'] for col in inspector.get_columns('interviews')]
    
    updates = [
        ("stage", "VARCHAR DEFAULT 'Screening'"),
        ("ai_suggestion", "TEXT"),
        ("candidate_id", "INTEGER REFERENCES users(id)"),
        ("interviewer_id", "INTEGER REFERENCES users(id)"),
        ("scheduled_date", "TIMESTAMP") # Might conflict if exists as string
    ]
    
    for col_name, col_def in updates:
        if col_name not in existing_columns:
            try:
                conn.execute(text(f"ALTER TABLE interviews ADD COLUMN {col_name} {col_def}"))
                print(f"  ✓ {col_name} column added")
            except Exception as e:
                print(f"  ! Could not add {col_name}: {e}")
        else:
            print(f"  - {col_name} column already exists")

    conn.commit()
    conn.close()
    
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_migration()
