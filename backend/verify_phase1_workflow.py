import requests
import time
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
HR_EMAIL = "hr_admin@example.com"  # Ensure this user exists/is created
HR_PASSWORD = "password123"        # Default password from seed?
# If you don't have this user, register one first via the script or use existing credentials.

def print_step(step, msg):
    print(f"\n[Step {step}] {msg}")
    print("-" * 50)

def login():
    print_step(0, "Authenticating...")
    # Try login
    try:
        resp = requests.post(f"{BASE_URL}/auth/token", data={
            "username": HR_EMAIL,
            "password": HR_PASSWORD
        })
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            print(f"✓ Authenticated as {HR_EMAIL}")
            return token
    except Exception:
        pass
        
    print("! Login failed (User might not exist). Attempting registration...")
    # Register if needed
    reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": HR_EMAIL,
        "password": HR_PASSWORD,
        "full_name": "HR Admin Test",
        "role": "HR_ADMIN",
        "organization_name": "Test Corp"
    })
    if reg_resp.status_code in [200, 201]:
        print("✓ Registered new HR Admin")
        # Login again
        resp = requests.post(f"{BASE_URL}/auth/token", data={
            "username": HR_EMAIL,
            "password": HR_PASSWORD
        })
        return resp.json()["access_token"]
    else:
        print(f"✗ Registration failed: {reg_resp.text}")
        sys.exit(1)

def run_verification():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Job
    print_step(1, "Creating Job Posting")
    job_payload = {
        "title": f"Senior AI Engineer {int(time.time())}",
        "description": "We are looking for an expert in Python and AI logic.",
        "requirements": "Python, FastAPI, LLMs",
        "roles_responsibilities": "Design and implement AI agents.",
        "candidate_profile": {
            "education": "Masters or PhD",
            "experience": "5+ years",
            "required_skills": ["Python", "System Design", "NLP"]
        },
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "Full-time"
    }
    
    resp = requests.post(f"{BASE_URL}/jobs", json=job_payload, headers=headers)
    if resp.status_code != 200:
        print(f"✗ Failed to create job: {resp.text}")
        return
    job = resp.json()
    job_id = job["id"]
    print(f"✓ Job Created: ID {job_id} - {job['title']}")
    print(f"  - Profile: {json.dumps(job['candidate_profile'])}")

    # 2. Submit Resume
    print_step(2, "Submitting Candidate Resume")
    resume_payload = {
        "name": "Jane Developer",
        "resume_text": """
        Jane Developer
        Email: jane@example.com | Phone: 555-0100
        
        EXPERIENCE
        Senior AI Engineer at TechCorp (2020-Present)
        - Designed AI agents using Python and LLMs.
        - Built FastAPI backends for high-scale processing.
        
        EDUCATION
        M.S. Computer Science, Stanford University
        
        SKILLS
        Python, NLP, PyTorch, Docker, Kubernetes
        """,
        "blind_screening": True
    }
    
    resp = requests.post(f"{BASE_URL}/jobs/{job_id}/resumes", json=resume_payload, headers=headers)
    if resp.status_code != 200:
        print(f"✗ Failed to submit resume: {resp.text}")
        return
    resume_sub = resp.json()
    resume_id = resume_sub["id"]
    print(f"✓ Resume Submitted: ID {resume_id}")
    print(f"  - Status: {resume_sub['status']}")
    print(f"  - Message: {resume_sub['message']}")
    
    # 3. Poll for Analysis
    print_step(3, "Observing Analysis Lifecycle (Polling)")
    
    max_retries = 10
    for i in range(max_retries):
        resp = requests.get(f"{BASE_URL}/jobs/{job_id}/resumes", headers=headers)
        resumes = resp.json()
        target_resume = next((r for r in resumes if r["id"] == resume_id), None)
        
        if not target_resume:
            print("  - Waiting for resume to appear in list...")
            time.sleep(2)
            continue
            
        status = target_resume.get("status")
        ai_score = target_resume.get("ai_score")
        
        print(f"  [Attempt {i+1}] Status: {status} | Score: {ai_score}")
        
        if ai_score > 0:
            print("\n✓ Analysis Completed!")
            
            # 4. Verify Content
            print_step(4, "Verifying Results & Transparency")
            
            # Anonymization
            anonymized = target_resume.get("anonymized_text", "")
            if "[EMAIL]" in anonymized and "Jane Developer" not in anonymized:
                 print(f"✓ Anonymization Verified: PII removed.")
            else:
                 print(f"⚠ Anonymization Check: {anonymized[:100]}...")

            # Scoring
            print(f"✓ Overall Score: {target_resume['ai_score']}")
            print(f"✓ Skills Match: {target_resume['skills_match_score']}")
            print(f"✓ Seniority Match: {target_resume['seniority_match_score']}")
            
            # Trust
            trust = target_resume.get("trust_metadata", {})
            print(f"✓ Confidence: {trust.get('confidence_score')} ({trust.get('confidence_level')})")
            print(f"✓ Reasoning: {trust.get('reasoning')}")
            
            # Evidence
            evidence = target_resume.get("ai_evidence", [])
            print(f"✓ Evidence Points: {len(evidence)}")
            if evidence:
                print(f"  - Example: {evidence[0]}")
                
            break
        
        time.sleep(3)
    else:
        print("✗ Timed out waiting for AI analysis to complete.")

if __name__ == "__main__":
    try:
        run_verification()
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to backend. Is it running on localhost:8000?")
