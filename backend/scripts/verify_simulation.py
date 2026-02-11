#!/usr/bin/env python3
"""
API-Only End-to-End Simulation Script for HR AI Platform

This script validates the platform as a real SaaS product by interacting
ONLY through public HTTP API endpoints after initial user seeding.

Direct database access is limited to:
- Initializing the database schema
- Seeding test users and organization
- Seeding leave balances (required for leave workflow)

All business operations (authentication, hiring, interviews, leave, payroll)
are performed strictly through API endpoints using access tokens.
"""

import sys
import os
import requests
import time
from typing import Dict, Any, Optional

# Add parent directory for initial seeding imports only
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
PASSWORD = "SecurePass123!"

# User Configuration
USERS = {
    "admin": {"email": "sim_admin@company.com", "role": "hr_admin", "dept": "HR"},
    "manager": {"email": "sim_manager@company.com", "role": "hr_staff", "dept": "Engineering"},
    "employee": {"email": "sim_employee@company.com", "role": "employee", "dept": "Engineering"}
}


class SimulationError(Exception):
    """Raised when a simulation step fails."""
    pass


class HRSimulation:
    """
    End-to-end simulation that validates the HR AI Platform through API calls only.
    
    Attributes:
        tokens: Dict mapping user keys to their access tokens
        data: Dict storing entity IDs created during simulation
        org_id: Organization ID for the simulation
    """
    
    def __init__(self):
        self.tokens: Dict[str, str] = {}
        self.data: Dict[str, Any] = {}
        self.org_id: Optional[int] = None
        self.passed_checks = 0
        self.failed_checks = 0
    
    # =========================================================================
    # SECTION 1: DATABASE SEEDING (Only permitted DB access)
    # =========================================================================
    
    def seed_users(self):
        """
        Seed test users and organization directly to database.
        This is the ONLY permitted direct database access.
        """
        print("\n" + "="*60)
        print("[SETUP] Initializing Database and Seeding Users...")
        print("="*60)
        
        from app.database import SessionLocal, init_db
        from app.models.user import User, UserRole
        from app.models.organization import Organization
        from app.models.leave_balance import LeaveBalance
        from app.models.employee import Employee
        from app.services.auth import get_password_hash
        
        init_db()
        db = SessionLocal()
        
        try:
            # 1. Ensure Organization
            org = db.query(Organization).filter(Organization.name == "Simulation Corp").first()
            if not org:
                org = Organization(
                    name="Simulation Corp",
                    slug="simulation-corp",
                    is_active=True,
                    subscription_tier="enterprise"
                )
                db.add(org)
                db.commit()
                db.refresh(org)
                print(f"  ✓ Created Organization: {org.name} (ID: {org.id})")
            else:
                print(f"  ✓ Found Organization: {org.name} (ID: {org.id})")
            
            self.org_id = org.id
            
            # Role mapping
            role_map = {
                "hr_admin": UserRole.HR_ADMIN,
                "hr_staff": UserRole.HR_STAFF,
                "employee": UserRole.EMPLOYEE
            }
            
            # 2. Ensure Users
            for key, info in USERS.items():
                user = db.query(User).filter(User.email == info["email"]).first()
                if not user:
                    user = User(
                        email=info["email"],
                        hashed_password=get_password_hash(PASSWORD),
                        role=role_map[info["role"]],
                        department=info["dept"],
                        organization_id=org.id,
                        is_active=True
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    print(f"  ✓ Created User: {key} ({info['email']})")
                else:
                    # Ensure org mapping is correct
                    if user.organization_id != org.id:
                        user.organization_id = org.id
                        db.commit()
                    print(f"  ✓ Found User: {key} ({info['email']})")
                
                # Store user ID for employee creation
                self.data[f"{key}_user_id"] = user.id
            
            # 3. Ensure Employee record for 'employee' user (needed for wellbeing analysis)
            employee_user_id = self.data["employee_user_id"]
            employee = db.query(Employee).filter(Employee.id == employee_user_id).first()
            if not employee:
                employee = Employee(
                    id=employee_user_id,
                    name="Simulation Employee",
                    email=USERS["employee"]["email"],
                    organization_id=org.id
                )
                db.add(employee)
                db.commit()
                print(f"  ✓ Created Employee record for simulation")
            
            # 4. Ensure Leave Balance for employee (needed for leave workflow)
            emp_id_str = str(employee_user_id)
            balance = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == emp_id_str,
                LeaveBalance.leave_type == "Annual"
            ).first()
            if not balance:
                balance = LeaveBalance(
                    employee_id=emp_id_str,
                    leave_type="Annual",
                    total_days=20,
                    used_days=0,
                    remaining_days=20,
                    year=2026
                )
                db.add(balance)
                db.commit()
                print(f"  ✓ Created Leave Balance for employee")
            else:
                print(f"  ✓ Found Leave Balance for employee")
                
        except Exception as e:
            print(f"\n  ✗ CRITICAL SETUP ERROR: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            db.close()
        
        print("  Setup complete.\n")
    
    # =========================================================================
    # SECTION 2: API HELPERS
    # =========================================================================
    
    def _headers(self, user_key: str) -> Dict[str, str]:
        """Get authorization headers for a user."""
        if user_key not in self.tokens:
            raise SimulationError(f"No token available for user: {user_key}")
        return {"Authorization": f"Bearer {self.tokens[user_key]}"}
    
    def _api_call(self, method: str, endpoint: str, user_key: str, 
                  json_data: Dict = None, params: Dict = None,
                  expected_status: int = 200) -> requests.Response:
        """Make an API call and return the response."""
        url = f"{BASE_URL}/api{endpoint}"
        headers = self._headers(user_key)
        
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=json_data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=json_data)
        elif method.upper() == "PATCH":
            response = requests.patch(url, headers=headers, json=json_data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unknown HTTP method: {method}")
        
        return response
    
    def _check(self, condition: bool, pass_msg: str, fail_msg: str) -> bool:
        """Record a check result."""
        if condition:
            print(f"    ✓ {pass_msg}")
            self.passed_checks += 1
            return True
        else:
            print(f"    ✗ {fail_msg}")
            self.failed_checks += 1
            return False
    
    # =========================================================================
    # SECTION 3: AUTHENTICATION (API Only)
    # =========================================================================
    
    def authenticate_all_users(self):
        """Authenticate all users via API and store tokens."""
        print("\n" + "="*60)
        print("[AUTH] Authenticating All Users via API...")
        print("="*60)
        
        for key, info in USERS.items():
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": info["email"], "password": PASSWORD}
            )
            
            if response.status_code != 200:
                print(f"  ✗ FAILED login for {key}: {response.text}")
                raise SimulationError(f"Authentication failed for {key}")
            
            data = response.json()
            self.tokens[key] = data["access_token"]
            print(f"  ✓ Logged in: {key} (Role: {info['role']})")
        
        print("  All users authenticated successfully.\n")
    
    def verify_auth_me(self):
        """Verify /auth/me endpoint returns correct user data."""
        print("  Verifying /auth/me endpoint...")
        
        for key in USERS.keys():
            response = self._api_call("GET", "/auth/me", key)
            self._check(
                response.status_code == 200,
                f"/auth/me works for {key}",
                f"/auth/me failed for {key}: {response.text}"
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.data[f"{key}_id"] = user_data["id"]
    
    # =========================================================================
    # SECTION 4: HIRING WORKFLOW (API Only)
    # =========================================================================
    
    def run_hiring_workflow(self):
        """Test the complete hiring workflow through API."""
        print("\n" + "="*60)
        print("[WORKFLOW] Hiring Flow...")
        print("="*60)
        
        # 1. Create Job (Admin)
        print("\n  Step 1: Create Job (Admin)")
        job_payload = {
            "title": "Simulation Engineer",
            "department": "Engineering",
            "description": "Build and maintain simulation systems.",
            "requirements": "Python, SQL, Docker",
            "roles_responsibilities": "Write code, review PRs, maintain CI/CD",
            "desired_responsibilities": "Lead projects, mentor juniors",
            "candidate_profile": {
                "education": "BS Computer Science",
                "experience": "3+ years",
                "skills": ["Python", "SQL", "Docker"]
            }
        }
        
        response = self._api_call("POST", "/jobs/", "admin", json_data=job_payload)
        if not self._check(response.status_code == 200, "Job created successfully", 
                          f"Create Job failed: {response.text}"):
            return
        
        self.data["job_id"] = response.json()["id"]
        print(f"    → Job ID: {self.data['job_id']}")
        
        # Verify audit log
        self._verify_audit("create_job", "job")
        
        # 2. View Job (Manager) - RBAC check
        print("\n  Step 2: View Job (Manager)")
        response = self._api_call("GET", f"/jobs/{self.data['job_id']}", "manager")
        self._check(response.status_code == 200, "Manager can view job", 
                   f"Manager view job failed: {response.text}")
        
        # 3. Submit Resume (Employee acting as candidate)
        print("\n  Step 3: Submit Resume (Employee)")
        resume_payload = {
            "name": "John Doe",
            "resume_text": "Experienced Python developer with 5 years in backend systems. Expert in SQL and Docker. Led migration to microservices architecture.",
            "blind_screening": True
        }
        
        response = self._api_call("POST", f"/jobs/{self.data['job_id']}/resumes", 
                                  "employee", json_data=resume_payload)
        if not self._check(response.status_code == 200, "Resume submitted successfully",
                          f"Submit Resume failed: {response.text}"):
            return
        
        self.data["resume_id"] = response.json()["id"]
        print(f"    → Resume ID: {self.data['resume_id']}")
        
        # Verify audit log
        self._verify_audit("submit_resume", "resume")
        
        # 4. Wait for background analysis and verify
        print("\n  Step 4: Waiting for Resume Analysis...")
        time.sleep(2)
        
        for i in range(5):
            if self._verify_audit("analyze_resume", "resume", silent=True):
                print("    ✓ Resume analysis completed")
                break
            print(f"    ...waiting for analysis (attempt {i+1}/5)...")
            time.sleep(2)
        else:
            print("    ⚠ Resume analysis may not have completed")
        
        # 5. List Resumes (Manager) - Verify data access
        print("\n  Step 5: List Resumes (Manager)")
        response = self._api_call("GET", f"/jobs/{self.data['job_id']}/resumes", "manager")
        self._check(
            response.status_code == 200 and len(response.json()) > 0,
            f"Manager can list resumes (found {len(response.json()) if response.ok else 0})",
            f"List resumes failed: {response.text}"
        )
    
    # =========================================================================
    # SECTION 5: INTERVIEW WORKFLOW (API Only)
    # =========================================================================
    
    def run_interview_workflow(self):
        """Test the interview workflow through API."""
        print("\n" + "="*60)
        print("[WORKFLOW] Interview Flow...")
        print("="*60)
        
        # 1. Create Interview (Manager)
        print("\n  Step 1: Create Interview (Manager)")
        interview_payload = {
            "candidate_name": "John Doe",
            "candidate_email": "johndoe@example.com",
            "interviewer_name": "Jane Manager",
            "interviewer_email": "jane@company.com",
            "job_title": "Simulation Engineer",
            "preferred_dates": "2026-02-10, 2026-02-11, 2026-02-12"
        }
        
        response = self._api_call("POST", "/interviews/", "manager", json_data=interview_payload)
        if not self._check(response.status_code == 200, "Interview created successfully",
                          f"Create Interview failed: {response.text}"):
            return
        
        self.data["interview_id"] = response.json()["id"]
        print(f"    → Interview ID: {self.data['interview_id']}")
        
        # 2. Generate Interview Kit (Manager)
        print("\n  Step 2: Generate Interview Kit (Manager)")
        response = self._api_call("POST", f"/interviews/{self.data['interview_id']}/kit", "manager")
        kit_created = self._check(
            response.status_code == 200,
            "Interview kit generated",
            f"Generate kit failed: {response.text}"
        )
        
        # 3. Confirm Interview (Manager)
        print("\n  Step 3: Confirm Interview Schedule (Manager)")
        confirm_payload = {
            "scheduled_date": "2026-02-11",
            "scheduled_time": "14:00",
            "meeting_link": "https://meet.company.com/interview-123"
        }
        
        response = self._api_call("PUT", f"/interviews/{self.data['interview_id']}/confirm", 
                                  "manager", json_data=confirm_payload)
        self._check(response.status_code == 200, "Interview confirmed",
                   f"Confirm interview failed: {response.text}")
        
        # 4. Submit Feedback (Manager)
        print("\n  Step 4: Submit Interview Feedback (Manager)")
        feedback_payload = {
            "interview_id": self.data["interview_id"],
            "scores": {"technical": 4, "communication": 5, "culture_fit": 4},
            "overall_score": 4.3,
            "strengths": "Strong Python skills, excellent communication",
            "weaknesses": "Limited Docker experience",
            "recommendation": "hire",
            "comments": "Recommend for hire pending technical deep-dive on containers."
        }
        
        response = self._api_call("POST", "/interviews/feedback", "manager", json_data=feedback_payload)
        self._check(response.status_code == 200, "Feedback submitted successfully",
                   f"Submit feedback failed: {response.text}")
    
    # =========================================================================
    # SECTION 6: WELLBEING/RISK WORKFLOW (API Only)
    # =========================================================================
    
    def run_wellbeing_workflow(self):
        """Test the wellbeing/risk assessment workflow through API."""
        print("\n" + "="*60)
        print("[WORKFLOW] Wellbeing & Risk Assessment...")
        print("="*60)
        
        employee_id = self.data.get("employee_id") or self.data.get("employee_user_id")
        
        # 1. Analyze Wellbeing (Manager)
        print("\n  Step 1: Assess Employee Wellbeing (Manager)")
        response = self._api_call("POST", f"/wellbeing/analyze/{employee_id}", "manager")
        
        if self._check(response.status_code == 200, "Wellbeing assessment completed",
                      f"Wellbeing analysis failed: {response.text}"):
            # Verify TrustedAIResponse structure
            self._verify_trust_response(response.json(), "Wellbeing Assessment")
            self._verify_audit("wellbeing_assessment", "wellbeing_assessment")
        
        # 2. RBAC Test: Employee should NOT be able to run analysis
        print("\n  Step 2: RBAC Test - Employee Cannot Analyze")
        response = self._api_call("POST", f"/wellbeing/analyze/{employee_id}", "employee")
        self._check(
            response.status_code == 403,
            "RBAC enforced - Employee blocked (403)",
            f"RBAC FAILED - Employee got {response.status_code} instead of 403"
        )
    
    # =========================================================================
    # SECTION 7: LEAVE WORKFLOW (API Only)
    # =========================================================================
    
    def run_leave_workflow(self):
        """Test the leave request workflow through API."""
        print("\n" + "="*60)
        print("[WORKFLOW] Leave Request Flow...")
        print("="*60)
        
        employee_id = str(self.data.get("employee_id") or self.data.get("employee_user_id"))
        
        # 1. Submit Leave Request (Employee)
        print("\n  Step 1: Submit Leave Request (Employee)")
        leave_payload = {
            "employee_id": employee_id,
            "leave_type": "Annual",
            "start_date": "2026-05-01",
            "end_date": "2026-05-05",
            "days_count": 5,
            "reason": "Family vacation - planned trip"
        }
        
        response = self._api_call("POST", "/leave/request", "employee", json_data=leave_payload)
        if not self._check(response.status_code == 200, "Leave request submitted",
                          f"Leave request failed: {response.text}"):
            return
        
        self.data["leave_request_id"] = response.json()["id"]
        print(f"    → Leave Request ID: {self.data['leave_request_id']}")
        
        self._verify_audit("submit_leave_request", "leave_request")
        
        # 2. Get Impact Analysis (Manager)
        print("\n  Step 2: Get Leave Impact Analysis (Manager)")
        response = self._api_call("GET", "/leave/impact-analysis", "manager",
                                  params={"days_count": 5, "leave_type": "Annual"})
        self._check(response.status_code == 200, "Impact analysis retrieved",
                   f"Impact analysis failed: {response.text}")
        
        # 3. Check Eligibility (Employee)
        print("\n  Step 3: Check Leave Eligibility (Employee)")
        response = self._api_call("POST", "/leave/check-eligibility", "employee",
                                  params={"employee_id": employee_id, "leave_type": "Annual", "days_count": 5})
        self._check(response.status_code == 200, "Eligibility check passed",
                   f"Eligibility check failed: {response.text}")
        
        # 4. Approve Leave (Manager)
        print("\n  Step 4: Approve Leave Request (Manager)")
        response = self._api_call("PUT", f"/leave/requests/{self.data['leave_request_id']}/approve", "manager")
        self._check(response.status_code == 200, "Leave request approved",
                   f"Approve leave failed: {response.text}")
        
        self._verify_audit("approve_leave_request", "leave_request")
    
    # =========================================================================
    # SECTION 8: PAYROLL WORKFLOW (API Only)
    # =========================================================================
    
    def run_payroll_workflow(self):
        """Test the payroll workflow through API."""
        print("\n" + "="*60)
        print("[WORKFLOW] Payroll Flow...")
        print("="*60)
        
        month = 5
        year = 2026
        employee_id = self.data.get("employee_id") or self.data.get("employee_user_id")
        
        # 1. Calculate Payroll (Admin) - Before Lock
        print("\n  Step 1: Calculate Payroll (Admin)")
        payroll_payload = {
            "employee_id": employee_id,
            "month": month,
            "year": year,
            "base_salary": 5000.00
        }
        
        response = self._api_call("POST", "/payroll/calculate", "admin", json_data=payroll_payload)
        calc_before_lock = self._check(
            response.status_code == 200 or response.status_code == 400,  # 400 if already locked
            f"Payroll calculation attempt (status: {response.status_code})",
            f"Payroll calculation error: {response.text}"
        )
        
        if response.status_code == 200:
            self._verify_audit("calculate_payroll", "payroll")
        
        # 2. Lock Payroll Period (Admin Only)
        print("\n  Step 2: Lock Payroll Period (Admin)")
        lock_payload = {"month": month, "year": year}
        response = self._api_call("POST", "/payroll/lock", "admin", json_data=lock_payload)
        
        if response.status_code == 200:
            self._check(True, f"Payroll period {month}/{year} locked", "")
            self._verify_audit("lock_payroll", "payroll_period")
        elif "already locked" in response.text.lower():
            print(f"    ℹ Payroll period already locked (OK)")
        else:
            self._check(False, "", f"Lock payroll failed: {response.text}")
        
        # 3. Try Calculate After Lock (Should Fail)
        print("\n  Step 3: Verify Lock Prevents Calculation")
        response = self._api_call("POST", "/payroll/calculate", "admin", json_data=payroll_payload)
        self._check(
            response.status_code == 400,
            "Locked period blocks calculation (400)",
            f"Lock NOT enforced - got {response.status_code}"
        )
        
        # 4. RBAC Test: Manager trying to lock (should fail)
        print("\n  Step 4: RBAC Test - Manager Cannot Lock")
        lock_payload_next = {"month": month + 1, "year": year}
        response = self._api_call("POST", "/payroll/lock", "manager", json_data=lock_payload_next)
        self._check(
            response.status_code == 403,
            "RBAC enforced - Manager cannot lock (403)",
            f"RBAC FAILED - Manager got {response.status_code}"
        )
    
    # =========================================================================
    # SECTION 9: AUDIT LOG VERIFICATION (API Only)
    # =========================================================================
    
    def _verify_audit(self, action: str, entity_type: str, silent: bool = False) -> bool:
        """Verify an audit log entry exists via API."""
        if not silent:
            print(f"    → Verifying Audit Log: {action}/{entity_type}")
        
        response = self._api_call("GET", "/admin/audit-logs", "admin",
                                  params={"action": action, "entity_type": entity_type, "limit": 1})
        
        if response.status_code != 200:
            if not silent:
                print(f"      ✗ Could not fetch audit logs: {response.text}")
            return False
        
        logs = response.json()
        if logs and len(logs) > 0:
            if not silent:
                print(f"      ✓ Audit log found (ID: {logs[0]['id']})")
            return True
        else:
            if not silent:
                print(f"      ✗ No audit log found for {action}")
            return False
    
    def _verify_trust_response(self, response_json: Dict, context: str) -> bool:
        """Verify TrustedAIResponse structure."""
        print(f"    → Verifying AI Trust for {context}...")
        
        if "trust" not in response_json:
            print(f"      ✗ Missing 'trust' field in response")
            self.failed_checks += 1
            return False
        
        trust = response_json["trust"]
        
        if "confidence_score" not in trust:
            print(f"      ✗ Missing confidence_score in trust metadata")
            self.failed_checks += 1
            return False
        
        print(f"      ✓ Trust verified (Score: {trust.get('confidence_score')}, Model: {trust.get('ai_model')})")
        self.passed_checks += 1
        return True
    
    # =========================================================================
    # SECTION 10: MAIN EXECUTION
    # =========================================================================
    
    def run(self):
        """Execute the complete simulation."""
        print("\n" + "="*60)
        print("  HR AI PLATFORM - API-ONLY SIMULATION")
        print("="*60)
        print(f"  Target: {BASE_URL}")
        print(f"  Mode: Real SaaS Validation (API Only)")
        print("="*60)
        
        try:
            # Phase 1: Setup (Direct DB - Only permitted)
            self.seed_users()
            
            # Phase 2: Authentication (API)
            self.authenticate_all_users()
            self.verify_auth_me()
            
            # Phase 3: Business Workflows (All API)
            self.run_hiring_workflow()
            self.run_interview_workflow()
            self.run_wellbeing_workflow()
            self.run_leave_workflow()
            self.run_payroll_workflow()
            
        except SimulationError as e:
            print(f"\n✗ SIMULATION FAILED: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"\n✗ UNEXPECTED ERROR: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        
        # Summary
        print("\n" + "="*60)
        print("  SIMULATION SUMMARY")
        print("="*60)
        print(f"  Passed Checks: {self.passed_checks}")
        print(f"  Failed Checks: {self.failed_checks}")
        total = self.passed_checks + self.failed_checks
        if total > 0:
            success_rate = (self.passed_checks / total) * 100
            print(f"  Success Rate: {success_rate:.1f}%")
        
        if self.failed_checks == 0:
            print("\n  ✓ ALL CHECKS PASSED - Platform validated successfully!")
        else:
            print(f"\n  ⚠ {self.failed_checks} check(s) failed - Review required")
        
        print("="*60 + "\n")
        
        return self.failed_checks == 0


if __name__ == "__main__":
    sim = HRSimulation()
    success = sim.run()
    sys.exit(0 if success else 1)
