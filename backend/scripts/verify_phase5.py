import sys
import os
import requests
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

BASE_URL = "http://localhost:8000"
# Admin credentials (assuming seeded)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin" # Default

def login():
    print(f"Logging in as {ADMIN_EMAIL}...")
    response = requests.post(f"{BASE_URL}/api/auth/token", data={
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    return response.json()["access_token"]

def verify_hiring(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Verifying Hiring Flow ---")
    
    # 1. Create Job
    job_payload = {
        "title": "Senior AI Engineer",
        "department": "Engineering",
        "requirements": "Strong Python",
        "description": "Build AI stuff.",
        "candidate_profile": {
            "education": "PhD AI",
            "experience": "5 years",
            "skills": ["Python", "PyTorch", "FastAPI"]
        }
    }
    res = requests.post(f"{BASE_URL}/api/jobs/", json=job_payload, headers=headers)
    if res.status_code != 200:
        print(f"Create Job Failed: {res.text}")
        return
    job = res.json()
    print(f"Job Created: ID {job['id']}")
    
    # 2. Submit Resume (Weak candidate to trigger rejection reason)
    resume_payload = {
        "name": "Junior Dev",
        "resume_text": "I checked out some tutorials on HTML. I want to build AI.",
        "blind_screening": True
    }
    res = requests.post(f"{BASE_URL}/api/jobs/{job['id']}/resumes", json=resume_payload, headers=headers)
    if res.status_code != 200:
         print(f"Submit Resume Failed: {res.text}")
         return
    resume = res.json()
    print(f"Resume Submitted: ID {resume['id']}")
    
    # Note: Analysis is async background task. We can't verify result immediately without waiting.
    # In integration test, we might poll or trigger worker manually? 
    # For this script, we just trigger it.
    print("Resume Analysis triggered in background.")

def verify_payroll_lock(token):
    headers = {"Authorization": f"Bearer {token}"}
    print("\n--- Verifying Payroll Lock ---")
    
    month = 12
    year = 2025
    
    # 1. Lock Period
    res = requests.post(f"{BASE_URL}/api/payroll/lock", json={"month": month, "year": year}, headers=headers)
    if res.status_code == 200:
        print(f"Locked Payroll for {month}/{year}: {res.json()['message']}")
    else:
        print(f"Lock failed (might likely be already locked): {res.text}")
        
    # 2. Try Calculate (Expect Fail)
    calc_payload = {
        "employee_id": 1, 
        "month": month,
        "year": year,
        "base_salary": 5000
    }
    res = requests.post(f"{BASE_URL}/api/payroll/calculate", json=calc_payload, headers=headers)
    if res.status_code == 400:
         print("SUCCESS: Payroll Calculation blocked as expected.")
    else:
         print(f"FAILURE: Payroll Calculation allowed or other error: {res.status_code} {res.text}")

def main():
    token = login()
    if token:
        verify_hiring(token)
        verify_payroll_lock(token)
    else:
        print("Cannot verify without login.")

if __name__ == "__main__":
    main()
