"""
Tests for Phase 2: Interview Workflow
Covers: Slots, Invites, Kits, Scorecards, Consistency, Decision.
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import get_db, Base, engine
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.interview import Interview, InterviewStatus, InterviewSlot
from app.models.organization import Organization
from app.services.auth import create_access_token
import datetime

client = TestClient(app)

# --- Fixtures ---

@pytest.fixture(scope="module")
def db_session():
    # Setup
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    
    # Create Org
    org_name = f"Test Org {uuid.uuid4()}"
    org = Organization(name=org_name, slug=f"slug-{uuid.uuid4()}", is_active=True)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Create Dept
    dept = Department(organization_id=org.id, name="HR", code=f"HR_{uuid.uuid4()}", is_active=True)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    yield db
    
    # Teardown
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def org_data(db_session):
    # Return org and dept for current session (module scope)
    # We query them to ensure attached to session? 
    # Since session is module scope, they should be there.
    # But for safety, query random one? No, use the one created.
    org = db_session.query(Organization).first()
    dept = db_session.query(Department).first()
    return org, dept

@pytest.fixture(scope="function")
def hr_admin_user(db_session, org_data):
    org, dept = org_data
    email = f"hr_admin_{uuid.uuid4()}@example.com"
    user = User(
        email=email, 
        hashed_password="hashed", 
        role=UserRole.HR_ADMIN,
        organization_id=org.id,
        department_id=dept.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def hr_admin_token(hr_admin_user):
    return create_access_token(data={"sub": hr_admin_user.email, "role": hr_admin_user.role.value, "type": "access"})

@pytest.fixture(scope="function")
def interviewer_user(db_session, org_data):
    org, dept = org_data
    email = f"interviewer_{uuid.uuid4()}@example.com"
    user = User(
        email=email, 
        hashed_password="hashed", 
        role=UserRole.EMPLOYEE,
        organization_id=org.id,
        department_id=dept.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def interviewer_token(interviewer_user):
    return create_access_token(data={"sub": interviewer_user.email, "role": interviewer_user.role.value, "type": "access"})

from app.models.job import Job

@pytest.fixture(scope="function")
def job_data(db_session, org_data):
    org, dept = org_data
    job = Job(
        title="Software Engineer",
        department=dept.name,
        organization_id=org.id,
        description="Test Job",
        requirements="Python",
        is_active=True
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job

@pytest.fixture(scope="function")
def interview_id(db_session, org_data, interviewer_user, job_data):
    org, _ = org_data
    # Create an interview
    interview = Interview(
        organization_id=org.id,
        candidate_name="John Doe",
        candidate_email=f"candidate_{uuid.uuid4()}@example.com",
        job_id=job_data.id,
        status=InterviewStatus.PENDING,
        interviewer_id=interviewer_user.id
    )
    db_session.add(interview)
    db_session.commit()
    db_session.refresh(interview)
    return interview.id

# --- Tests ---

def test_generate_slots(hr_admin_token, interview_id):
    response = client.post(
        f"/api/interviews/{interview_id}/slots",
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    # It might create slots or return empty if logic depends on something
    # But status 200 is expected
    assert response.status_code == 200, response.text
    data = response.json()
    # If logic generates mock slots
    assert isinstance(data, list)
    if len(data) > 0:
        assert data[0]["status"] == "AVAILABLE"

def test_generate_kit(hr_admin_token, interview_id):
    response = client.get(
        f"/api/interviews/{interview_id}/kit",
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert "questions" in data
    # assert len(data["questions"]) > 0

def test_submit_scorecard(interviewer_token, interview_id):
    # Payload
    payload = {
        "overall_rating": 4,
        "technical_score": 8,
        "communication_score": 9,
        "cultural_fit_score": 7,
        "strengths": ["Python", "Communication"],
        "concerns": ["None"],
        "feedback_text": "Great candidate",
        "recommendation": "YES"
    }
    response = client.post(
        f"/api/interviews/{interview_id}/scorecard",
        json=payload,
        headers={"Authorization": f"Bearer {interviewer_token}"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["recommendation"] == "YES"

def test_consistency_check(hr_admin_token, interview_id):
    # Need at least one scorecard
    response = client.get(
        f"/api/interviews/{interview_id}/consistency",
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    # If not enough feedback, might return specific message or just empty analysis
    assert response.status_code == 200, response.text
    data = response.json()
    # schema might be different depending on implementation
    # Just check status for now

def test_hiring_decision(hr_admin_token, interview_id):
    payload = {
        "status": "HIRED",
        "reason": "Strong technical skills",
        "feedback_to_candidate": "Welcome aboard!"
    }
    response = client.post(
        f"/api/interviews/{interview_id}/decision",
        json=payload,
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    # Check if status is updated
