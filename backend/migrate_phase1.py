"""
Database migration script for Phase 1: Job Creation & Resume Screening Refactor
Adds new fields to jobs and resumes tables for structured job descriptions and transparent scoring.
"""

import sqlite3
import sys
import os

# Add parent directory to path to import database module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def migrate_database(db_path="database.db"):
    """Apply Phase 1 schema changes to the database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("Phase 1 Migration: Job & Resume Schema Enhancement")
    print("=" * 60)
    
    try:
        # ===== JOB TABLE MIGRATIONS =====
        print("\n[1/2] Migrating jobs table...")
        
        # Check if new columns already exist
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'roles_responsibilities' not in columns:
            print("  - Adding roles_responsibilities column...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN roles_responsibilities TEXT")
        else:
            print("  - roles_responsibilities column already exists, skipping")
        
        if 'desired_responsibilities' not in columns:
            print("  - Adding desired_responsibilities column...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN desired_responsibilities TEXT")
        else:
            print("  - desired_responsibilities column already exists, skipping")
        
        if 'candidate_profile' not in columns:
            print("  - Adding candidate_profile column...")
            cursor.execute("ALTER TABLE jobs ADD COLUMN candidate_profile TEXT")  # JSON stored as TEXT in SQLite
        else:
            print("  - candidate_profile column already exists, skipping")
        
        print("  ✓ Jobs table migration complete")
        
        # ===== RESUME TABLE MIGRATIONS =====
        print("\n[2/2] Migrating resumes table...")
        
        cursor.execute("PRAGMA table_info(resumes)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'skills_match_score' not in columns:
            print("  - Adding skills_match_score column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN skills_match_score REAL")
        else:
            print("  - skills_match_score column already exists, skipping")
        
        if 'seniority_match_score' not in columns:
            print("  - Adding seniority_match_score column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN seniority_match_score REAL")
        else:
            print("  - seniority_match_score column already exists, skipping")
        
        if 'domain_relevance_score' not in columns:
            print("  - Adding domain_relevance_score column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN domain_relevance_score REAL")
        else:
            print("  - domain_relevance_score column already exists, skipping")
        
        if 'missing_requirements' not in columns:
            print("  - Adding missing_requirements column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN missing_requirements TEXT")  # JSON stored as TEXT
        else:
            print("  - missing_requirements column already exists, skipping")
        
        if 'blind_screening_enabled' not in columns:
            print("  - Adding blind_screening_enabled column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN blind_screening_enabled INTEGER DEFAULT 0 NOT NULL")
        else:
            print("  - blind_screening_enabled column already exists, skipping")
        
        print("  ✓ Resumes table migration complete")
        
        # Commit changes
        conn.commit()
        print("\n" + "=" * 60)
        print("✓ Phase 1 migration completed successfully!")
        print("=" * 60)
        
        # Verify changes
        print("\n[Verification] Checking schema changes...")
        cursor.execute("PRAGMA table_info(jobs)")
        job_cols = [col[1] for col in cursor.fetchall()]
        print(f"  Jobs table columns: {len(job_cols)} total")
        print(f"    - roles_responsibilities: {'✓' if 'roles_responsibilities' in job_cols else '✗'}")
        print(f"    - desired_responsibilities: {'✓' if 'desired_responsibilities' in job_cols else '✗'}")
        print(f"    - candidate_profile: {'✓' if 'candidate_profile' in job_cols else '✗'}")
        
        cursor.execute("PRAGMA table_info(resumes)")
        resume_cols = [col[1] for col in cursor.fetchall()]
        print(f"  Resumes table columns: {len(resume_cols)} total")
        print(f"    - skills_match_score: {'✓' if 'skills_match_score' in resume_cols else '✗'}")
        print(f"    - seniority_match_score: {'✓' if 'seniority_match_score' in resume_cols else '✗'}")
        print(f"    - domain_relevance_score: {'✓' if 'domain_relevance_score' in resume_cols else '✗'}")
        print(f"    - missing_requirements: {'✓' if 'missing_requirements' in resume_cols else '✗'}")
        print(f"    - blind_screening_enabled: {'✓' if 'blind_screening_enabled' in resume_cols else '✗'}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    # Run migration on both database files
    print("Running migration on backend database...")
    success1 = migrate_database("database.db")
    
    print("\n" + "=" * 60)
    print("Running migration on root database...")
    success2 = migrate_database("../database.db")
    
    if success1 or success2:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
