import requests

# First login to get a token
login_url = "http://localhost:5001/api/auth/login"
login_data = {
    "username": "biswajit",
    "password": "admin123"
}

print("Step 1: Login to get token...")
response = requests.post(login_url, json=login_data)
data = response.json()
token = data.get('access_token')
print(f"Token received: {token[:50]}...")

# Now test the /auth/me endpoint
print("\nStep 2: Test /api/auth/me endpoint...")
me_url = "http://localhost:5001/api/auth/me"
headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get(me_url, headers=headers)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 200:
    print("\n❌ /auth/me endpoint is FAILING!")
    print("This is why login appears to not work in the frontend.")
else:
    print("\n✅ /auth/me endpoint works!")
