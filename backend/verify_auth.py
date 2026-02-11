import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.database import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.employee import Employee
from app.models.job import Job
from app.models.resume import Resume
from app.models.interview import Interview
from app.core.config import settings
from app.services import auth as auth_service
from passlib.context import CryptContext

# Setup DB connection
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify():
    print("="*60)
    print("VERIFYING AUTHENTICATION STATE")
    print("="*60)
    
    # Check Admin User
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        print("❌ Admin user NOT FOUND in database! Creating it...")
        # Create Organization first if needed
        org = db.query(Organization).filter(Organization.id == 1).first()
        if not org:
            org = Organization(id=1, name="Demo Corp", slug="demo-corp")
            db.add(org)
            db.commit()
            print("   -> Created Organization 'Demo Corp'")
            
        hashed_password = auth_service.get_password_hash("admin123")
        user = User(
            email="admin@example.com",
            hashed_password=hashed_password,
            role="HR_ADMIN",
            is_active=True,
            organization_id=org.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"   -> Created User 'admin@example.com' (ID: {user.id})")
    
    print(f"✅ User found: {user.email} (ID: {user.id})")
    print(f"   Role: {user.role}")
    print(f"   Active: {user.is_active}")
    print(f"   Org ID: {user.organization_id}")
    
    # Check Password
    is_valid = pwd_context.verify("admin123", user.hashed_password)
    if is_valid:
        print("✅ Password 'admin123' validates correctly.")
    else:
        print("❌ Password 'admin123' INVALID!")
        # Reset password to admin123
        hashed = auth_service.get_password_hash("admin123")
        user.hashed_password = hashed
        db.commit()
        print("   -> Password reset to 'admin123'.")

    # Generate Token
    token = auth_service.create_access_token(data={"sub": user.email, "role": user.role, "type": "access"})
    print(f"✅ Generated Test Token: {token[:20]}...")
    
    # Decode Token
    try:
        payload = auth_service.decode_access_token(token)
        print(f"✅ Token decodes successfully: {payload}")
    except Exception as e:
        print(f"❌ Token decode failed: {str(e)}")

if __name__ == "__main__":
    try:
        verify()
    except Exception as e:
        print(f"❌ Verification failed with error: {str(e)}")
    finally:
        db.close()
