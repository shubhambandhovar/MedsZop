#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime

class MedsZopAPITester:
    def __init__(self, base_url=None):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method, endpoint, data=None, auth_token=None, expected_status=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            if expected_status and response.status_code != expected_status:
                return False, f"Expected {expected_status}, got {response.status_code}: {response.text[:200]}"

            return True, response
        except Exception as e:
            return False, f"Request failed: {str(e)}"

    def test_seed_data(self):
        """Test seeding database with sample data"""
        print("\n🌱 Testing Database Seeding...")
        success, result = self.make_request('POST', 'seed', expected_status=200)
        if success:
            self.log_test("Seed database", True)
        else:
            self.log_test("Seed database", False, result)

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🏥 Testing Health Endpoints...")
        
        # Test root endpoint
        success, result = self.make_request('GET', '', expected_status=200)
        self.log_test("Root endpoint", success, result if not success else "")
        
        # Test health endpoint
        success, result = self.make_request('GET', 'health', expected_status=200)
        self.log_test("Health check", success, result if not success else "")

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing User Registration...")
        
        test_email = f"test_{uuid.uuid4().hex[:8]}@medszop.com"
        user_data = {
            "email": test_email,
            "password": "testpass123",
            "name": "Test User",
            "phone": "9876543210",
            "role": "customer"
        }
        
        success, result = self.make_request('POST', 'auth/register', user_data, expected_status=200)
        if success:
            response_data = result.json()
            self.token = response_data.get('access_token')
            self.user_id = response_data.get('user', {}).get('id')
            self.log_test("User registration", True)
        else:
            self.log_test("User registration", False, result)

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Login...")
        
        login_data = {
            "email": "admin@medszop.com",
            "password": "admin123"
        }
        
        success, result = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        if success:
            response_data = result.json()
            self.admin_token = response_data.get('access_token')
            self.log_test("Admin login", True)
        else:
            self.log_test("Admin login", False, result)

    def test_user_login(self):
        """Test user login"""
        print("\n🔑 Testing User Login...")
        
        # Try to login with the registered user
        if not self.token:
            self.log_test("User login", False, "No user registered to test login")
            return
            
        # Test get current user
        success, result = self.make_request('GET', 'auth/me', auth_token=self.token, expected_status=200)
        self.log_test("Get current user", success, result if not success else "")

    def test_medicines_endpoints(self):
        """Test medicine-related endpoints"""
        print("\n💊 Testing Medicine Endpoints...")
        
        # Get all medicines
        success, result = self.make_request('GET', 'medicines', expected_status=200)
        medicines = []
        if success:
            medicines = result.json()
            self.log_test("Get medicines", True)
        else:
            self.log_test("Get medicines", False, result)
        
        # Get categories
        success, result = self.make_request('GET', 'medicines/categories', expected_status=200)
        self.log_test("Get categories", success, result if not success else "")
        
        # Search medicines
        success, result = self.make_request('GET', 'medicines/search?q=para', expected_status=200)
        self.log_test("Search medicines", success, result if not success else "")
        
        # Get specific medicine (if any exist)
        if medicines and len(medicines) > 0:
            medicine_id = medicines[0]['id']
            success, result = self.make_request('GET', f'medicines/{medicine_id}', expected_status=200)
            self.log_test("Get specific medicine", success, result if not success else "")
            return medicine_id
        else:
            self.log_test("Get specific medicine", False, "No medicines found to test")
            return None

    def test_cart_operations(self, medicine_id):
        """Test cart operations"""
        print("\n🛒 Testing Cart Operations...")
        
        if not self.token:
            self.log_test("Cart operations", False, "No user token available")
            return
        
        if not medicine_id:
            self.log_test("Cart operations", False, "No medicine ID available")
            return
        
        # Get empty cart
        success, result = self.make_request('GET', 'cart', auth_token=self.token, expected_status=200)
        self.log_test("Get cart", success, result if not success else "")
        
        # Add item to cart
        cart_item = {"medicine_id": medicine_id, "quantity": 2}
        success, result = self.make_request('POST', 'cart/add', cart_item, auth_token=self.token, expected_status=200)
        self.log_test("Add to cart", success, result if not success else "")
        
        # Update cart
        cart_update = {"items": [{"medicine_id": medicine_id, "quantity": 3}]}
        success, result = self.make_request('PUT', 'cart/update', cart_update, auth_token=self.token, expected_status=200)
        self.log_test("Update cart", success, result if not success else "")
        
        # Get cart with items
        success, result = self.make_request('GET', 'cart', auth_token=self.token, expected_status=200)
        self.log_test("Get cart with items", success, result if not success else "")

    def test_address_operations(self):
        """Test address operations"""
        print("\n🏠 Testing Address Operations...")
        
        if not self.token:
            self.log_test("Address operations", False, "No user token available")
            return
        
        # Get addresses
        success, result = self.make_request('GET', 'addresses', auth_token=self.token, expected_status=200)
        self.log_test("Get addresses", success, result if not success else "")
        
        # Add address
        address_data = {
            "street": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "landmark": "Near Test Mall",
            "is_default": True
        }
        success, result = self.make_request('POST', 'addresses', address_data, auth_token=self.token, expected_status=200)
        if success:
            self.log_test("Add address", True)
            return result.json().get('id')
        else:
            self.log_test("Add address", False, result)
            return None

    def test_order_operations(self, address_id):
        """Test order operations"""
        print("\n📦 Testing Order Operations...")
        
        if not self.token or not address_id:
            self.log_test("Order operations", False, "Missing token or address")
            return
        
        # Create order
        order_data = {
            "address_id": address_id,
            "payment_method": "cod"
        }
        success, result = self.make_request('POST', 'orders', order_data, auth_token=self.token, expected_status=200)
        order_id = None
        if success:
            order_id = result.json().get('order_id')
            self.log_test("Create order", True)
        else:
            self.log_test("Create order", False, result)
        
        # Get orders
        success, result = self.make_request('GET', 'orders', auth_token=self.token, expected_status=200)
        self.log_test("Get orders", success, result if not success else "")
        
        # Get specific order
        if order_id:
            success, result = self.make_request('GET', f'orders/{order_id}', auth_token=self.token, expected_status=200)
            self.log_test("Get specific order", success, result if not success else "")
            return order_id
        
        return None

    def test_payment_operations(self, order_id):
        """Test payment operations (mocked)"""
        print("\n💳 Testing Payment Operations...")
        
        if not self.token or not order_id:
            self.log_test("Payment operations", False, "Missing token or order ID")
            return
        
        # Create payment order (should return mock data)
        payment_data = {"order_id": order_id}
        success, result = self.make_request('POST', 'payments/create-order', payment_data, auth_token=self.token, expected_status=200)
        self.log_test("Create payment order (mocked)", success, result if not success else "")

    def test_ai_doctor_chat(self):
        """Test AI doctor chat"""
        print("\n🤖 Testing AI Doctor Chat...")
        
        if not self.token:
            self.log_test("AI doctor chat", False, "No user token available")
            return
        
        chat_data = {
            "message": "What are the side effects of Paracetamol?",
            "session_id": None
        }
        success, result = self.make_request('POST', 'ai/doctor-chat', chat_data, auth_token=self.token, expected_status=200)
        self.log_test("AI doctor chat", success, result if not success else "")

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin endpoints", False, "No admin token available")
            return
        
        # Get admin stats
        success, result = self.make_request('GET', 'admin/stats', auth_token=self.admin_token, expected_status=200)
        self.log_test("Get admin stats", success, result if not success else "")
        
        # Get users
        success, result = self.make_request('GET', 'admin/users', auth_token=self.admin_token, expected_status=200)
        self.log_test("Get admin users", success, result if not success else "")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting MedsZop API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Seed data first
        self.test_seed_data()
        
        # Authentication tests
        self.test_user_registration()
        self.test_admin_login()
        self.test_user_login()
        
        # Medicine tests
        medicine_id = self.test_medicines_endpoints()
        
        # Cart tests
        self.test_cart_operations(medicine_id)
        
        # Address tests
        address_id = self.test_address_operations()
        
        # Order tests
        order_id = self.test_order_operations(address_id)
        
        # Payment tests
        self.test_payment_operations(order_id)
        
        # AI tests
        self.test_ai_doctor_chat()
        
        # Admin tests
        self.test_admin_endpoints()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        print("\n" + "="*60)
        
        return len(self.failed_tests) == 0

def main():
    tester = MedsZopAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())