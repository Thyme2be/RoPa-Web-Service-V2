import requests

url = "http://localhost:8000/auth/login"
payload = {
    "username_or_email": "admin",
    "password": "Admin@1234"
}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
