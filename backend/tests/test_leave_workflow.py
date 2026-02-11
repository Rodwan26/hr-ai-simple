import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import get_db, Base, engine
from app.models.user import User, UserRole
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.services.auth import create_access_token
import uuid

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    # Setup
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    yield db
    # Teardown
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def employee_token(db_session):
    email = f"emp_{uuid.uuid4()}@example.com"
    user = User(
        email=email, 
        hashed_password="hashed", 
        role=UserRole.EMPLOYEE,
        full_name="John Doe",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return create_access_token(data={"sub": user.email, "role": user.role.value, "type": "access"})

@pytest.fixture(scope="function")
def manager_token(db_session):
    email = f"manager_{uuid.uuid4()}@example.com"
    user = User(
        email=email, 
        hashed_password="hashed", 
        role=UserRole.MANAGER,
        full_name="Jane Manager",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return create_access_token(data={"sub": user.email, "role": user.role.value, "type": "access"})

def test_create_leave_request(employee_token):
    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=5)
    
    response = client.post(
        "/api/leave/requests",
        headers={"Authorization": f"Bearer {employee_token}"},
        json={
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "leave_type": "Vacation"
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["conflict_detected"] == False
    return data["id"]

def test_manager_approval(manager_token, employee_token, db_session):
    # 1. Create request (as employee)
    req_id = test_create_leave_request(employee_token)
    
    # 2. Approve (as manager)
    response = client.post(
        "/api/leave/approve",
        headers={"Authorization": f"Bearer {manager_token}"},
        json={
            "request_id": req_id,
            "approve": True,
            "comment": "Approved!"
        }
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["success"] == True
    assert data["leave_status"] == LeaveStatus.APPROVED
    
    # Verify in DB
    leave = db_session.query(LeaveRequest).filter(LeaveRequest.id == req_id).first()
    assert leave.status == LeaveStatus.APPROVED

def test_calendar_view(manager_token, employee_token, db_session):
    # Ensure there is at least one APPROVED leave
    test_manager_approval(manager_token, employee_token, db_session)
    
    response = client.get(
        "/api/leave/calendar",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["status"] == LeaveStatus.APPROVED
    assert "full_name" in data[0]

def test_conflict_detection(employee_token, db_session):
    # 1. Create a request and APPROVE it manually
    start = date.today() + timedelta(days=20)
    end = start + timedelta(days=5)
    
    # Request 1
    resp1 = client.post(
        "/api/leave/requests",
        headers={"Authorization": f"Bearer {employee_token}"},
        json={
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "leave_type": "Vacation"
        }
    )
    data1 = resp1.json()
    req_id = data1["id"]
    
    # Approve it manually in DB
    leave = db_session.query(LeaveRequest).filter(LeaveRequest.id == req_id).first()
    leave.status = LeaveStatus.APPROVED
    db_session.commit()
    
    # 2. Create overlapping request
    start2 = start + timedelta(days=2) # Overlap
    end2 = end + timedelta(days=2)
    
    resp2 = client.post(
        "/api/leave/requests",
        headers={"Authorization": f"Bearer {employee_token}"},
        json={
            "start_date": start2.isoformat(),
            "end_date": end2.isoformat(),
            "leave_type": "Sick"
        }
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["conflict_detected"] == True
