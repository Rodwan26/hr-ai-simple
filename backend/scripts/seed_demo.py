import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.services.auth import get_password_hash
from app.models.governance import AIModelRegistry

def seed_demo_data():
    db = SessionLocal()
    init_db() # Ensure tables are created
    
    try:
        # 1. Create Demo Organization
        demo_org = db.query(Organization).filter(Organization.slug == "demo-corp").first()
        if not demo_org:
            demo_org = Organization(
                name="Demo Corporation",
                slug="demo-corp",
                usage_limits={
                    "ai_calls_per_month": 5000,
                    "max_documents": 200,
                    "max_users": 50
                },
                subscription_tier="enterprise"
            )
            db.add(demo_org)
            db.commit()
            db.refresh(demo_org)
            print(f"Created Demo Organization: {demo_org.name}")
        
        # 2. Create Demo Admin User
        demo_admin = db.query(User).filter(User.email == "admin@demo.com").first()
        if not demo_admin:
            demo_admin = User(
                email="admin@demo.com",
                hashed_password=get_password_hash("demo-admin-pass"),
                full_name="Demo Admin",
                role=UserRole.ADMIN,
                organization_id=demo_org.id,
                is_active=True
            )
            db.add(demo_admin)
            db.commit()
            print(f"Created Demo Admin User: {demo_admin.email}")

        # 3. Create Model Registry Entries for domains
        domains = ["resume", "interview", "wellbeing", "audit", "documents"]
        for domain in domains:
            exists = db.query(AIModelRegistry).filter(AIModelRegistry.domain == domain, AIModelRegistry.is_active == True).first()
            if not exists:
                model = AIModelRegistry(
                    domain=domain,
                    version="1.0.0",
                    model_name="google/gemini-2.0-flash-exp:free",
                    prompt_template=f"Default enterprise prompt for {domain}",
                    parameters={"temperature": 0.5},
                    is_active=True
                )
                db.add(model)
        db.commit()
        print("Model Registry seeded for demo.")

        print("\nDemo Seeding Complete!")
        print("Admin Login: admin@demo.com / demo-admin-pass")
        
    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
