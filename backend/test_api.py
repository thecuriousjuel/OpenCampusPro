import requests
import json

# Test the login endpoint directly
url = "http://localhost:5001/api/auth/login"
data = {
    "username": "biswajit",
    "password": "admin123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Data: {data}")
print("-" * 50)

try:
    response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ Login successful!")
        print(f"Access Token: {data.get('access_token', 'NOT FOUND')[:50]}...")
        print(f"User: {data.get('user')}")
    else:
        print(f"\n❌ Login failed!")
        
except Exception as e:
    print(f"❌ Error: {e}")
