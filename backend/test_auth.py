import requests
import sys

BASE_URL = "http://localhost:8000"
EMAIL = "admin@example.com"
PASSWORD = "admin123"

def test_login():
    print(f"Attempting login for {EMAIL}...")
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if response.status_code == 200:
            print("Login successful.")
            return response.json()
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Connection failed: {e}")
        return None

def test_protected(token):
    print("Attempting to access /api/auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code == 200:
            print("Protected route access successful.")
            print(response.json())
        else:
            print(f"Protected route failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    token_data = test_login()
    if token_data:
        token = token_data.get("access_token")
        test_protected(token)
    else:
        sys.exit(1)
