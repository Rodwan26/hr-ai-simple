import requests
import time
import uuid

BASE_URL = "http://localhost:8001/api"

def test_health():
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.json()}")

def test_rate_limiting():
    print("\nTesting Rate Limiting on /wellbeing/check-friction...")
    # This endpoint has 20/minute limit
    for i in range(5):
        response = requests.post(
            f"{BASE_URL}/wellbeing/check-friction",
            json={"text": "Test friction text"}
        )
        print(f"Attempt {i+1}: {response.status_code}")
        if response.status_code == 429:
            print("SUCCESS: Rate limit triggered!")
            return
    print("Rate limit not triggered (expected 429 if limit is low, but we only did 5 attempts)")

def test_caching():
    print("\nTesting AI Caching (indirectly via timing)...")
    # This requires an actual AI call or mocked one. Since we are using real OpenRouter,
    # the second call should be significantly faster if cached.
    # But wait, we need to be logged in to test most endpoints.
    print("Skipping detailed cache timing test without auth.")

if __name__ == "__main__":
    try:
        test_health()
        test_rate_limiting()
    except Exception as e:
        print(f"Error: {e}")
