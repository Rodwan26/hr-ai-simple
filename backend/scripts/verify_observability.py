import requests
import time
import json
import uuid

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    assert "request-id" in response.headers or "X-Request-ID" in response.headers

def test_correlation_id():
    print("\nTesting Correlation ID propagation...")
    trace_id = str(uuid.uuid4())
    headers = {"X-Request-ID": trace_id}
    response = requests.get(f"{BASE_URL}/health", headers=headers)
    
    resp_id = response.headers.get("X-Request-ID")
    print(f"Sent ID: {trace_id}")
    print(f"Received ID: {resp_id}")
    assert resp_id == trace_id

def test_error_envelope():
    print("\nTesting standardized error envelope (404)...")
    response = requests.get(f"{BASE_URL}/api/non-existent-route")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Envelope: {json.dumps(data, indent=2)}")
    assert data["success"] == False
    assert "code" in data
    assert "message" in data

def test_metrics():
    print("\nTesting /metrics endpoint...")
    response = requests.get(f"{BASE_URL}/metrics")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200

if __name__ == "__main__":
    try:
        test_health()
        test_correlation_id()
        test_error_envelope()
        test_metrics()
        print("\nVerification successful!")
    except Exception as e:
        print(f"\nVerification failed: {e}")
        print("Note: Ensure the backend server is running at http://localhost:8000")
