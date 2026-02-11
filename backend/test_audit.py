import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.services.auth import create_access_token
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
import json

# Setup in-memory DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)
Base.metadata.create_all(bind=engine_test)

def override_get_db():
    try:
        db = Session(bind=engine_test)
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

class TestAuditLogs(unittest.TestCase):
    
    def setUp(self):
        # Clear tables before each test if needed, or just rely on new DB per run?
        # For simplicity in this script, we rely on the global in-memory DB 
        # but transaction rollback would be better.
        # Given the simplicity, we just run sequentially.
        pass

    def get_admin_token(self):
        db = Session(bind=engine_test)
        user = db.query(User).filter(User.email == "admin@test.com").first()
        if not user:
            user = User(
                email="admin@test.com",
                hashed_password="fakehash",
                role=UserRole.HR_ADMIN,
                is_active=True,
                name="Admin User"
            )
            db.add(user)
            db.commit()
        token = create_access_token(data={"sub": user.email, "role": user.role})
        db.close()
        return token

    def get_employee_token(self):
        db = Session(bind=engine_test)
        user = db.query(User).filter(User.email == "emp@test.com").first()
        if not user:
            user = User(
                email="emp@test.com",
                hashed_password="fakehash",
                role=UserRole.EMPLOYEE,
                is_active=True,
                name="Employee User",
                department="Engineering"
            )
            db.add(user)
            db.commit()
        token = create_access_token(data={"sub": user.email, "role": user.role})
        db.close()
        return token

    def test_01_audit_logs_read_only_admin(self):
        admin_token = self.get_admin_token()
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Create a dummy log entry manually
        db = Session(bind=engine_test)
        log = AuditLog(
            action="test_action",
            entity_type="test_entity",
            entity_id=1,
            details={"foo": "bar"},
            before_state={"status": "old"},
            after_state={"status": "new"}
        )
        db.add(log)
        db.commit()
        log_id = log.id
        db.close()

        # 2. Test Read List
        response = client.get("/api/admin/audit-logs", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]["action"], "test_action")
        self.assertEqual(data[0]["before_state"], {"status": "old"})

        # 3. Test Read Detail
        response = client.get(f"/api/admin/audit-logs/{log_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["after_state"], {"status": "new"})

    def test_02_audit_logs_forbidden_for_employee(self):
        emp_token = self.get_employee_token()
        headers = {"Authorization": f"Bearer {emp_token}"}
        
        response = client.get("/api/admin/audit-logs", headers=headers)
        self.assertEqual(response.status_code, 403)

    def test_03_leave_request_creates_audit(self):
        emp_token = self.get_employee_token()
        headers = {"Authorization": f"Bearer {emp_token}"}
        
        payload = {
            "employee_id": "1", 
            "leave_type": "Vacation",
            "start_date": "2024-01-01",
            "end_date": "2024-01-05",
            "days_count": 5,
            "reason": "Vacation"
        }

        db = Session(bind=engine_test)
        # Seed imports
        from app.models.leave_balance import LeaveBalance
        from app.models.leave_policy import LeavePolicy
        
        if not db.query(LeavePolicy).filter_by(leave_type="Vacation").first():
            db.add(LeavePolicy(leave_type="Vacation", max_days_per_year=20, requires_approval=True))
        if not db.query(LeaveBalance).filter_by(employee_id="1", leave_type="Vacation").first():
            db.add(LeaveBalance(employee_id="1", leave_type="Vacation", total_days=20, used_days=0, remaining_days=20, year=2024))
        db.commit()
        db.close()

        # Check existing logs count
        db = Session(bind=engine_test)
        initial_count = db.query(AuditLog).filter(AuditLog.action == "submit_leave_request").count()
        db.close()

        # Submit request
        response = client.post("/api/leave/request", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verify Audit Log created
        db = Session(bind=engine_test)
        new_count = db.query(AuditLog).filter(AuditLog.action == "submit_leave_request").count()
        self.assertEqual(new_count, initial_count + 1)
        
        log = db.query(AuditLog).filter(AuditLog.action == "submit_leave_request").order_by(AuditLog.id.desc()).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.entity_type, "leave_request")
        self.assertEqual(log.details["days"], 5.0)
        db.close()

if __name__ == '__main__':
    unittest.main()
