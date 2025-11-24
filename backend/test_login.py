import requests
import json

# Test the login endpoint
url = "http://localhost:5001/api/auth/login"
data = {
    "username": "biswajit",
    "password": "test123"  # Try with a test password
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
