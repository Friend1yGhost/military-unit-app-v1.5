import requests
import sys
import json
from datetime import datetime, timedelta

class MilitaryAppTester:
    def __init__(self, base_url="https://two22-tsapb.onrender.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_news_id = None
        self.test_duty_id = None
        self.test_group_id = None
        self.group_users = []
        self.test_user_1_id = None
        self.test_user_2_id = None
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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
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
        """Test admin login with provided credentials from review request"""
        # Use the credentials from review request
        success, response = self.run_test(
            "Admin Login (Review Request Credentials)",
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

    def test_get_settings(self):
        """Test get settings endpoint (public) - Review Request Test"""
        success, response = self.run_test(
            "Get Settings (Review Request)",
            "GET",
            "settings",
            200
        )
        if success:
            print(f"   ✅ Settings data received: {response.get('unit_name', 'No unit_name')}")
        return success

    def test_get_news(self):
        """Test get news endpoint (public) - Review Request Test"""
        success, response = self.run_test(
            "Get News (Review Request)",
            "GET",
            "news",
            200
        )
        if success:
            print(f"   ✅ News data received: {len(response)} news items")
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
        if success:
            print(f"   ✅ Users data received: {len(response)} users")
        return success and isinstance(response, list)

    def test_cors_headers(self):
        """Test CORS headers - Review Request Test"""
        url = f"{self.api_url}/settings"
        
        try:
            # Make an OPTIONS request to check CORS
            response = requests.options(url)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            print(f"🔍 Testing CORS Headers...")
            print(f"   Status Code: {response.status_code}")
            for header, value in cors_headers.items():
                if value:
                    print(f"   ✅ {header}: {value}")
                else:
                    print(f"   ❌ {header}: Not present")
            
            # Check if basic CORS headers are present
            has_origin = cors_headers['Access-Control-Allow-Origin'] is not None
            has_methods = cors_headers['Access-Control-Allow-Methods'] is not None
            
            if has_origin and has_methods:
                print("   ✅ CORS headers present")
                return True
            else:
                print("   ❌ Missing essential CORS headers")
                return False
                
        except Exception as e:
            print(f"❌ CORS test failed with error: {str(e)}")
            return False

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

    def test_get_groups(self):
        """Test get groups endpoint"""
        if not self.admin_token:
            print("❌ No admin token available for groups endpoint")
            return False
            
        success, response = self.run_test(
            "Get Groups",
            "GET",
            "groups",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Found {len(response)} groups")
            # Store first group for member testing
            if response and len(response) > 0:
                self.test_group_id = response[0]['id']
                print(f"   ✅ Using group: {response[0]['name']} (ID: {self.test_group_id})")
            return True
        return False

    def test_get_group_members(self):
        """Test get group members endpoint"""
        if not self.admin_token:
            print("❌ No admin token available for group members endpoint")
            return False
            
        if not hasattr(self, 'test_group_id') or not self.test_group_id:
            print("❌ No group ID available for members test")
            return False
            
        success, response = self.run_test(
            "Get Group Members",
            "GET",
            f"groups/{self.test_group_id}/members",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Found {len(response)} members in group")
            # Store users for duty testing
            if response and len(response) > 0:
                self.group_users = response
                print(f"   ✅ Available users: {[u['full_name'] for u in response[:3]]}")
            return True
        return False

    def test_new_bulk_duty_creation(self):
        """Test NEW bulk duty creation endpoint with simplified model"""
        if not self.admin_token:
            print("❌ No admin token available for bulk duty creation")
            return False
            
        # Get users if we don't have them from groups
        if not hasattr(self, 'group_users') or not self.group_users:
            success, users_response = self.run_test(
                "Get Users for Bulk Duty",
                "GET",
                "users",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if not success or not users_response or len(users_response) == 0:
                print("❌ No users available for bulk duty creation")
                return False
            self.group_users = users_response
            
        # Use first two users for testing
        user1 = self.group_users[0]
        user2 = self.group_users[1] if len(self.group_users) > 1 else self.group_users[0]
        
        print(f"   Using users: {user1['full_name']} and {user2['full_name']}")
        
        # Test NEW bulk duty creation format
        success, response = self.run_test(
            "NEW Bulk Duty Creation",
            "POST",
            "duties/bulk",
            200,
            data={
                "duties": [
                    {
                        "user_id": user1['id'],
                        "dates": ["2025-11-22", "2025-11-23", "2025-11-24"]
                    },
                    {
                        "user_id": user2['id'],
                        "dates": ["2025-11-22", "2025-11-25"]
                    }
                ]
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Bulk creation successful: {response.get('message', 'No message')}")
            print(f"   ✅ Created duties count: {response.get('count', 'Unknown')}")
            
            # Store user IDs for further testing
            self.test_user_1_id = user1['id']
            self.test_user_2_id = user2['id']
            
            return True
        return False

    def test_get_user_duties(self):
        """Test get user duties endpoint"""
        if not self.admin_token or not hasattr(self, 'test_user_1_id'):
            print("❌ No admin token or user ID available for user duties test")
            return False
            
        success, response = self.run_test(
            "Get User Duties",
            "GET",
            f"duties/user/{self.test_user_1_id}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Found {len(response)} duties for user")
            if response:
                sample_duty = response[0]
                print(f"   ✅ Sample duty structure: id={sample_duty.get('id')}, user_id={sample_duty.get('user_id')}, user_name={sample_duty.get('user_name')}, duty_date={sample_duty.get('duty_date')}")
                
                # Verify new structure (should have duty_date, not shift_start/shift_end)
                if 'duty_date' in sample_duty and 'shift_start' not in sample_duty:
                    print("   ✅ New duty structure confirmed (duty_date field present)")
                    return True
                else:
                    print("   ❌ Old duty structure detected")
                    return False
            return True
        return False

    def test_update_user_duties(self):
        """Test update user duties endpoint"""
        if not self.admin_token or not hasattr(self, 'test_user_1_id'):
            print("❌ No admin token or user ID available for update duties test")
            return False
            
        success, response = self.run_test(
            "Update User Duties",
            "PUT",
            f"duties/user/{self.test_user_1_id}",
            200,
            data={
                "dates": ["2025-11-26", "2025-11-27", "2025-11-28"]
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Update successful: {response.get('message', 'No message')}")
            print(f"   ✅ Updated duties count: {response.get('count', 'Unknown')}")
            
            # Verify the update by getting user duties again
            verify_success, duties_response = self.run_test(
                "Verify Updated Duties",
                "GET",
                f"duties/user/{self.test_user_1_id}",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if verify_success:
                duty_dates = [duty['duty_date'] for duty in duties_response]
                expected_dates = ["2025-11-26", "2025-11-27", "2025-11-28"]
                
                if all(date in duty_dates for date in expected_dates):
                    print("   ✅ All new dates found in user duties")
                    return True
                else:
                    print(f"   ❌ Expected dates not found. Got: {duty_dates}")
                    return False
            return True
        return False

    def test_delete_user_duties(self):
        """Test delete user duties endpoint"""
        if not self.admin_token or not hasattr(self, 'test_user_2_id'):
            print("❌ No admin token or user ID available for delete duties test")
            return False
            
        success, response = self.run_test(
            "Delete User Duties",
            "DELETE",
            f"duties/user/{self.test_user_2_id}",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Delete successful: {response.get('message', 'No message')}")
            print(f"   ✅ Deleted duties count: {response.get('count', 'Unknown')}")
            
            # Verify deletion by checking user duties
            verify_success, duties_response = self.run_test(
                "Verify Duties Deleted",
                "GET",
                f"duties/user/{self.test_user_2_id}",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            if verify_success and len(duties_response) == 0:
                print("   ✅ All duties successfully deleted")
                return True
            elif verify_success:
                print(f"   ❌ Still found {len(duties_response)} duties after deletion")
                return False
            return True
        return False

    def test_get_all_duties_structure(self):
        """Test get all duties endpoint and verify structure"""
        if not self.admin_token:
            print("❌ No admin token available for duties endpoint")
            return False
            
        success, response = self.run_test(
            "Get All Duties (Structure Check)",
            "GET",
            "duties",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        if success:
            print(f"   ✅ Found {len(response)} total duties")
            if response:
                sample_duty = response[0]
                required_fields = ['id', 'user_id', 'user_name', 'duty_date']
                old_fields = ['duty_type', 'position', 'shift_start', 'shift_end', 'rotation_cycle', 'notes']
                
                # Check for required new fields
                missing_fields = [field for field in required_fields if field not in sample_duty]
                present_old_fields = [field for field in old_fields if field in sample_duty]
                
                if not missing_fields and not present_old_fields:
                    print("   ✅ New duty structure confirmed - all required fields present, no old fields")
                    print(f"   ✅ Sample: {sample_duty}")
                    return True
                else:
                    print(f"   ❌ Structure issues - Missing: {missing_fields}, Old fields present: {present_old_fields}")
                    return False
            return True
        return False

def main():
    print("🚀 Starting Military Unit Application API Tests")
    print("=" * 60)
    
    tester = MilitaryAppTester()
    
    # Test sequence - NEW duty system endpoints as per review request
    tests = [
        ("1. Admin Authentication", tester.test_admin_login),
        ("2. Get Current User", tester.test_get_me),
        ("3. Get Groups", tester.test_get_groups),
        ("4. Get Group Members", tester.test_get_group_members),
        ("5. 🎯 NEW Bulk Duty Creation", tester.test_new_bulk_duty_creation),
        ("6. Get User Duties", tester.test_get_user_duties),
        ("7. Update User Duties", tester.test_update_user_duties),
        ("8. Delete User Duties", tester.test_delete_user_duties),
        ("9. Get All Duties (Structure Check)", tester.test_get_all_duties_structure),
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