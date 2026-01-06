#!/usr/bin/env python
"""
Тест нового login endpoint
"""
import requests
import json

def test_login():
    url = 'http://localhost:8000/api/auth/login/'
    data = {
        'email': 'manager@pkubg.com',
        'password': 'manager123'
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"Response keys: {list(result.keys())}")
            
            if 'user' in result:
                user = result['user']
                print(f"✅ User data found:")
                print(f"  Email: {user.get('email')}")
                print(f"  Name: {user.get('first_name')} {user.get('last_name')}")
                print(f"  Role: {user.get('role')}")
                print(f"  ID: {user.get('id')}")
            else:
                print("❌ No user data in response")
                print(f"Response: {json.dumps(result, indent=2)}")
                
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_login()