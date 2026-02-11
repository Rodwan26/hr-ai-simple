import requests
import json
import uuid

BASE_URL = "http://localhost:8001"

def test_health_check():
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Body: {response.json()}")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    except Exception as e:
        print(f"FAILED: {e}")

def test_correlation_id():
    print("\nTesting Correlation ID Middleware...")
    try:
        req_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/", headers={"X-Request-ID": req_id})
        print(f"Status: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        assert response.headers.get("X-Request-ID") == req_id
        
        # Test auto-generation
        response_auto = requests.get(f"{BASE_URL}/")
        assert "X-Request-ID" in response_auto.headers
        print(f"Auto-generated ID: {response_auto.headers['X-Request-ID']}")
    except Exception as e:
        print(f"FAILED: {e}")

def test_unified_error():
    print("\nTesting Unified Error Envelope (404)...")
    try:
        response = requests.get(f"{BASE_URL}/api/non-existent-route")
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Body: {json.dumps(data, indent=2)}")
        assert data["success"] == False
        assert "error" in data
        assert data["error"]["code"] == "HTTP_404"
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    # Note: Backend must be running for these tests
    test_health_check()
    test_correlation_id()
    test_unified_error()
