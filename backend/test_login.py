import requests
import json

url = "http://localhost:8000/api/auth/login"
data = {
    "email": "admin@example.com",
    "password": "yourpassword" # Using whatever password might be expected or just testing format
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=data, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Headers: {json.dumps(dict(response.headers), indent=2)}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
