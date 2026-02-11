import requests
import json

base_url = "http://localhost:8000/api/setup"

data = {
    "organization_name": "Test Org",
    "admin_name": "Admin Tester",
    "admin_email": "admin@test.com",
    "password": "password123"
}

def test_init():
    try:
        print(f"Testing initialization at {base_url}/initialize...")
        response = requests.post(f"{base_url}/initialize", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("\nTesting duplicate initialization (should fail)...")
            dup_response = requests.post(f"{base_url}/initialize", json=data)
            print(f"Status: {dup_response.status_code}")
            print(f"Response: {json.dumps(dup_response.json(), indent=2)}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_init()
