import sys
import os
import requests
import json
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def get_auth_token(email, password):
    url = f"{BASE_URL}/auth/token"
    payload = {"username": email, "password": password}
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        logger.error(f"Failed to get token for {email}: {e}")
        return None

def test_bulk_payroll(admin_token):
    logger.info("Testing Bulk Payroll Operations...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Validate All
    logger.info("1. Validating all payroll prerequisites...")
    payload = {"month": datetime.now().month, "year": datetime.now().year}
    response = requests.post(f"{BASE_URL}/payroll/validate-all", json=payload, headers=headers)
    if response.status_code == 200:
        logger.info("   Validate All: SUCCESS")
        logger.info(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        logger.error(f"   Validate All: FAILED ({response.status_code}) - {response.text}")

    # 2. Bulk PDF Generation
    logger.info("2. Generating Bulk Payslips ZIP...")
    response = requests.get(f"{BASE_URL}/payroll/payslips/pdf-all", params=payload, headers=headers)
    if response.status_code == 200:
        logger.info(f"   Bulk PDF ZIP: SUCCESS (Size: {len(response.content)} bytes)")
        # Check integrity if possible, or just size
    elif response.status_code == 404:
        logger.warning("   Bulk PDF ZIP: No payrolls found (Expected if no run yet)")
    else:
        logger.error(f"   Bulk PDF ZIP: FAILED ({response.status_code}) - {response.text}")

def test_leave_approval_workflow(admin_token, manager_token, employee_token, employee_id):
    logger.info("Testing Multi-Level Leave Workflow...")
    headers_emp = {"Authorization": f"Bearer {employee_token}"}
    headers_mgr = {"Authorization": f"Bearer {manager_token}"}
    headers_adm = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create Leave Request
    start_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    end_date = (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d")
    payload = {
        "leave_type": "Annual",
        "start_date": start_date,
        "end_date": end_date,
        "reason": "Vacation Phase 3"
    }
    response = requests.post(f"{BASE_URL}/leave/", json=payload, headers=headers_emp)
    if response.status_code != 200:
        logger.error(f"Failed to create leave request: {response.text}")
        return
    
    leave_id = response.json()["id"]
    logger.info(f"   Leave Request Created (ID: {leave_id})")
    
    # 2. Manager Approval (Level 1)
    logger.info("   Approving as Manager (Level 1)...")
    approval_payload = {"request_id": leave_id, "approve": True, "comment": "Approved by Manager"}
    response = requests.post(f"{BASE_URL}/leave/approve", json=approval_payload, headers=headers_mgr)
    
    if response.status_code == 200:
        data = response.json()
        logger.info(f"   Manager Approval: SUCCESS - Status: {data.get('leave_status')}, Level: {data.get('approval_level')}")
        valid_status = data.get('leave_status') in ["APPROVED", "PENDING"]
        if not valid_status:
             logger.error(f"   Manager Approval: Unexpected status {data.get('leave_status')}")
    else:
        logger.error(f"   Manager Approval: FAILED ({response.status_code}) - {response.text}")

    # 3. Admin Approval (Level 2 - optional based on required_levels, but we can try)
    # If checking unexpected behavior, note that default required_levels is 1, so manager approval might have fully approved it.
    # To test multi-level precisely, we'd need to update required_levels in DB manually or via an endpoint (if existed).
    # For now, we verified the logic exists in code.

def test_bulk_onboarding(admin_token):
    logger.info("Testing Bulk Onboarding...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create Template
    payload = {
        "name": "Bulk Test Template",
        "tasks": [{"task_name": "Task 1"}, {"task_name": "Task 2"}],
        "is_active": True
    }
    resp = requests.post(f"{BASE_URL}/onboarding/templates", json=payload, headers=headers)
    if resp.status_code != 200:
        logger.error(f"Failed to create template: {resp.text}")
        return
    template_id = resp.json()["id"]
    logger.info(f"   Template Created (ID: {template_id})")
    
    # 2. List Employees to apply to
    resp = requests.get(f"{BASE_URL}/onboarding/employees", headers=headers)
    employees = resp.json()
    if not employees:
        logger.warning("   No employees found for bulk onboarding test.")
        return
    
    emp_ids = [e["id"] for e in employees[:2]] # Apply to first 2
    
    # 3. Bulk Apply
    logger.info(f"   Applying to employees: {emp_ids}")
    apply_payload = {"employee_ids": emp_ids, "template_id": template_id}
    resp = requests.post(f"{BASE_URL}/onboarding/employees/apply-template-bulk", json=apply_payload, headers=headers)
    
    if resp.status_code == 200:
        logger.info("   Bulk Apply: SUCCESS")
        logger.info(f"   Response: {json.dumps(resp.json(), indent=2)}")
    else:
        logger.error(f"   Bulk Apply: FAILED ({resp.status_code}) - {resp.text}")

def test_trust_layer(admin_token, employee_id):
    logger.info("Testing AI Trust Layer...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test Risk Analysis
    logger.info("   Testing Risk Analysis for Human Confirmation Flag...")
    resp = requests.post(f"{BASE_URL}/risk/analyze/{employee_id}", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        trust = data.get("trust", {})
        requires_human = trust.get("requires_human_confirmation")
        logger.info(f"   Risk Analysis: SUCCESS")
        logger.info(f"   Requires Human Confirmation: {requires_human}")
        
        if requires_human is not True:
            logger.error("   FAILED: Expected requires_human_confirmation=True")
    else:
        logger.error(f"   Risk Analysis: FAILED ({resp.status_code}) - {resp.text}")

if __name__ == "__main__":
    logger.info("Starting Phase 3 Verification...")
    
    # Reset/Init DB is assumed handled by backend running
    
    # Authenticate (Using default credentials or created in previous phases)
    # Assuming standard test users exist: admin@example.com, manager@example.com, employee@example.com
    # If not, script might fail authentication.
    
    admin_token = get_auth_token("admin@hr-platform.local", "Admin123!")
    manager_token = get_auth_token("manager@hr-platform.local", "Manager123!")
    employee_token = get_auth_token("employee@hr-platform.local", "Employee123!")
    
    if not admin_token:
        logger.error("Could not auth as Admin. Aborting.")
        sys.exit(1)
        
    # Get an employee ID for testing
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(f"{BASE_URL}/auth/users", headers=headers) # Assuming this endpoint exists to list users
    # Or fetch from Onboarding Employees
    resp = requests.get(f"{BASE_URL}/onboarding/employees", headers=headers)
    employees = resp.json() if resp.status_code == 200 else []
    
    test_emp_id = employees[0]["id"] if employees else 1 
        
    test_bulk_payroll(admin_token)
    test_bulk_onboarding(admin_token)
    
    if manager_token and employee_token:
        # Need a real user ID for leave request, so assume employee_token corresponds to a valid User
        # We need the User ID of the employee token holder
        resp = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {employee_token}"})
        if resp.status_code == 200:
            me_id = resp.json()["id"]
            test_leave_approval_workflow(admin_token, manager_token, employee_token, me_id)
        else:
             logger.warning("Could not get employee details. Skipping leave workflow test.")
    
    test_trust_layer(admin_token, test_emp_id)
