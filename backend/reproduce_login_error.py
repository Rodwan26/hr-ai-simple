import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.services.audit import AuditService
from app.schemas.auth import LoginRequest
from app.services import auth as auth_service
from datetime import datetime, timedelta
import app.models # Test if this fixes the registry
# from app.models.organization import Organization # Removed manual fix

def reproduce():
    db = SessionLocal()
    try:
        # Mock data (use a user that exists or create one)
        email = "admin@hr-platform.local" # Adjust if needed
        # Ensure user exists for the test
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print("Creating test user...")
            user = User(
                email=email,
                hashed_password=auth_service.get_password_hash("password123"),
                role=UserRole.HR_ADMIN,
                is_active=True,
                department="HR"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        print(f"Testing login for {user.email}...")
        
        # Simulate Login Success Flow (Manual)
        access_token = auth_service.create_access_token(data={"sub": user.email, "role": user.role})
        refresh_token = auth_service.create_refresh_token(data={"sub": user.email})
        
        # Store session
        from app.models.user import UserSession
        expires_at = datetime.utcnow() + timedelta(days=7)
        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=expires_at
        )
        db.add(session)
        db.commit() # Possible failure point 1
        print("Session created.")

        # Log successful login (Audit)
        print("Attempting Audit Log...")
        AuditService.log(
            db,
            action="login",
            entity_type="user",
            entity_id=user.id,
            user_id=user.id,
            user_role=user.role, # This is the Enum
            details={"email": user.email},
            organization_id=user.organization_id
        )
        print("Audit Log SUCCESS!")

    except Exception as e:
        print("\n!!! CAUGHT EXCEPTION !!!")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reproduce()
