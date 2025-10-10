import requests
import sys
import json
from datetime import datetime, timedelta

class MilitaryAppTester:
    def __init__(self, base_url="https://troop-management-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_news_id = None
        self.test_duty_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "sheremet.b.s@gmail.com", "password": "8662196415q"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "full_name": "Тестовый Пользователь"
            }
        )
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   Test user created with ID: {self.test_user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": test_email, "password": "TestPass123!"}
        )
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   User token obtained: {self.user_token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user endpoint"""
        if not self.admin_token:
            print("❌ No admin token available for /auth/me test")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success and response.get('role') == 'admin'

    def test_get_news(self):
        """Test get news endpoint (public)"""
        success, response = self.run_test(
            "Get News (Public)",
            "GET",
            "news",
            200
        )
        return success

    def test_create_news(self):
        """Test creating news (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available for news creation")
            return False
            
        success, response = self.run_test(
            "Create News",
            "POST",
            "news",
            200,
            data={
                "title": "Тестовая Новость",
                "content": "Это тестовая новость для проверки API",
                "image_url": "https://example.com/test.jpg"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and 'id' in response:
            self.test_news_id = response['id']
            print(f"   News created with ID: {self.test_news_id}")
            return True
        return False

    def test_delete_news(self):
        """Test deleting news (admin only)"""
        if not self.admin_token or not self.test_news_id:
            print("❌ No admin token or news ID available for deletion")
            return False
            
        success, response = self.run_test(
            "Delete News",
            "DELETE",
            f"news/{self.test_news_id}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_get_users(self):
        """Test get users endpoint (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available for users endpoint")
            return False
            
        success, response = self.run_test(
            "Get Users",
            "GET",
            "users",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success and isinstance(response, list)

    def test_get_duties(self):
        """Test get all duties endpoint"""
        if not self.admin_token:
            print("❌ No admin token available for duties endpoint")
            return False
            
        success, response = self.run_test(
            "Get All Duties",
            "GET",
            "duties",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

    def test_create_duty(self):
        """Test creating duty roster (admin only)"""
        if not self.admin_token or not self.test_user_id:
            print("❌ No admin token or user ID available for duty creation")
            return False
            
        # Create duty with proper datetime format
        start_time = datetime.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=8)
        
        success, response = self.run_test(
            "Create Duty",
            "POST",
            "duties",
            200,
            data={
                "user_id": self.test_user_id,
                "duty_type": "Караул",
                "position": "Пост №1",
                "shift_start": start_time.isoformat(),
                "shift_end": end_time.isoformat(),
                "rotation_cycle": "weekly",
                "notes": "Тестовый наряд"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if success and 'id' in response:
            self.test_duty_id = response['id']
            print(f"   Duty created with ID: {self.test_duty_id}")
            return True
        return False

    def test_get_my_duties(self):
        """Test get my duties endpoint"""
        if not self.user_token:
            print("❌ No user token available for my duties endpoint")
            return False
            
        success, response = self.run_test(
            "Get My Duties",
            "GET",
            "duties/my",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"}
        )
        return success

    def test_delete_duty(self):
        """Test deleting duty (admin only)"""
        if not self.admin_token or not self.test_duty_id:
            print("❌ No admin token or duty ID available for deletion")
            return False
            
        success, response = self.run_test(
            "Delete Duty",
            "DELETE",
            f"duties/{self.test_duty_id}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        return success

def main():
    print("🚀 Starting Military Unit Application API Tests")
    print("=" * 60)
    
    tester = MilitaryAppTester()
    
    # Test sequence
    tests = [
        ("Admin Authentication", tester.test_admin_login),
        ("Get Current User", tester.test_get_me),
        ("User Registration", tester.test_user_registration),
        ("Get News (Public)", tester.test_get_news),
        ("Create News (Admin)", tester.test_create_news),
        ("Get Users (Admin)", tester.test_get_users),
        ("Get All Duties", tester.test_get_duties),
        ("Create Duty (Admin)", tester.test_create_duty),
        ("Get My Duties", tester.test_get_my_duties),
        ("Delete News (Admin)", tester.test_delete_news),
        ("Delete Duty (Admin)", tester.test_delete_duty),
    ]
    
    # Run tests
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            elif 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
                print(f"   Response: {failure.get('response', 'N/A')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())