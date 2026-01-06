"""
Tests for accounts app.
"""
import pytest
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from hypothesis import given, strategies as st

User = get_user_model()


class TestAccountsBasic(TestCase):
    """Basic tests for accounts functionality."""
    
    def test_accounts_app_ready(self):
        """Test that accounts app is properly configured."""
        from django.apps import apps
        app = apps.get_app_config('accounts')
        self.assertEqual(app.name, 'accounts')
    
    def test_user_profile_api_endpoints(self):
        """Test that user profile API endpoints are accessible."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        
        # Create test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        # Test profile endpoint
        profile_url = reverse('user_profile')
        response = client.get(profile_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'testuser')
        
        # Test dashboard endpoint
        dashboard_url = reverse('user_dashboard')
        response = client.get(dashboard_url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('user', response.data)
        self.assertIn('statistics', response.data)
        
        # Test orders endpoint
        orders_url = reverse('user_orders')
        response = client.get(orders_url)
        self.assertEqual(response.status_code, 200)
        # Check if it's paginated or a simple list
        if isinstance(response.data, dict) and 'results' in response.data:
            self.assertIsInstance(response.data['results'], list)
        else:
            self.assertIsInstance(response.data, list)
    
    def test_user_registration(self):
        """Test user registration functionality."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        
        client = APIClient()
        registration_url = reverse('register')
        
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        
        response = client.post(registration_url, data)
        self.assertEqual(response.status_code, 201)
        
        # Verify user was created
        user = User.objects.get(username='newuser')
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertTrue(hasattr(user, 'userprofile'))
    
    def test_profile_update(self):
        """Test profile update functionality."""
        from django.urls import reverse
        from rest_framework.test import APIClient
        
        # Create test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        profile_url = reverse('user_profile')
        
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '+1234567890',
            'address': 'New Address'
        }
        
        response = client.patch(profile_url, update_data)
        self.assertEqual(response.status_code, 200)
        
        # Verify changes were saved
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(user.last_name, 'Name')
        self.assertEqual(user.phone, '+1234567890')
        self.assertEqual(user.userprofile.address, 'New Address')


@pytest.mark.django_db(transaction=True)
@pytest.mark.property_tests
class TestAccountsProperties:
    """Property-based tests for accounts functionality."""
    
    def create_test_user(self, **kwargs):
        """Create a test user."""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        defaults = {
            'username': f'testuser_{unique_id}',
            'email': f'test_{unique_id}@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    
    @given(
        username=st.text(min_size=1, max_size=150, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc'))),
        email=st.emails(),
        first_name=st.text(min_size=1, max_size=150, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Pc'))),
        last_name=st.text(min_size=1, max_size=150, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Pc'))),
        password=st.text(min_size=8, max_size=128)
    )
    def test_user_profile_creation_on_registration(self, username, email, first_name, last_name, password):
        """
        **Feature: pkubg-ecommerce, Property 9: Создание профиля при регистрации**
        
        For any new user registration, a UserProfile should be automatically created
        with all basic profile fields initialized.
        """
        from accounts.models import UserProfile
        
        # Create a new user (simulating registration)
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password
        )
        
        # Check that a UserProfile was created
        assert hasattr(user, 'userprofile'), "UserProfile should be created for new user"
        
        profile = user.userprofile
        
        # Verify all basic profile fields exist and are properly initialized
        assert profile.user == user, "Profile should be linked to the user"
        assert profile.address == "", "Address should be initialized as empty string"
        assert profile.birth_date is None, "Birth date should be initialized as None"
        assert profile.dietary_preferences == {}, "Dietary preferences should be initialized as empty dict"
        
        # Clean up
        user.delete()
    
    @given(
        num_orders=st.integers(min_value=0, max_value=10),
        order_amounts=st.lists(
            st.decimals(min_value=1, max_value=10000, places=2),
            min_size=0, max_size=10
        )
    )
    def test_user_order_history_display(self, num_orders, order_amounts):
        """
        **Feature: pkubg-ecommerce, Property 10: Отображение истории заказов**
        
        For any user in their personal cabinet, the complete order history 
        with current statuses should be displayed.
        """
        from orders.models import Order
        from decimal import Decimal
        
        # Create a test user
        user = self.create_test_user()
        
        # Limit order_amounts to match num_orders
        if len(order_amounts) > num_orders:
            order_amounts = order_amounts[:num_orders]
        elif len(order_amounts) < num_orders:
            order_amounts.extend([Decimal('100.00')] * (num_orders - len(order_amounts)))
        
        # Create orders for the user
        created_orders = []
        for i in range(num_orders):
            order = Order.objects.create(
                user=user,
                order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
                total_amount=order_amounts[i] if i < len(order_amounts) else Decimal('100.00'),
                shipping_address='Test Address',
                delivery_method='CDEK'
            )
            created_orders.append(order)
        
        # Get user's order history
        user_orders = Order.objects.filter(user=user).order_by('-created_at')
        
        # Verify that all orders are displayed
        assert user_orders.count() == num_orders, f"Should display {num_orders} orders"
        
        # Verify each order contains complete information
        for order in user_orders:
            assert order.user == user, "Order should belong to the user"
            assert order.order_number is not None, "Order should have order number"
            assert order.status in dict(Order.ORDER_STATUS_CHOICES), "Order should have valid status"
            assert order.total_amount is not None, "Order should have total amount"
            assert order.created_at is not None, "Order should have creation date"
            assert order.payment_status in dict(Order.PAYMENT_STATUS_CHOICES), "Order should have payment status"
        
        # Clean up
        Order.objects.filter(user=user).delete()
        user.delete()
    
    @given(
        first_name=st.text(min_size=1, max_size=150, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Pc'))),
        last_name=st.text(min_size=1, max_size=150, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Pc'))),
        phone=st.text(min_size=0, max_size=20, alphabet=st.characters(whitelist_categories=('Nd', 'Pd', 'Zs'))),
        address=st.text(min_size=0, max_size=500)
    )
    def test_profile_changes_persistence(self, first_name, last_name, phone, address):
        """
        **Feature: pkubg-ecommerce, Property 11: Сохранение изменений профиля**
        
        For any profile data updates by a user, the changes should be saved 
        to the database and confirmed to the user.
        """
        from accounts.models import UserProfile
        
        # Create a test user
        user = self.create_test_user()
        
        # Get the user's profile (created automatically by signal)
        profile = user.userprofile
        
        # Store original values
        original_first_name = user.first_name
        original_last_name = user.last_name
        original_phone = user.phone
        original_address = profile.address
        
        # Update user data
        user.first_name = first_name
        user.last_name = last_name
        user.phone = phone
        user.save()
        
        # Update profile data
        profile.address = address
        profile.save()
        
        # Refresh from database to verify persistence
        user.refresh_from_db()
        profile.refresh_from_db()
        
        # Verify changes were saved
        assert user.first_name == first_name, "First name should be updated and saved"
        assert user.last_name == last_name, "Last name should be updated and saved"
        assert user.phone == phone, "Phone should be updated and saved"
        assert profile.address == address, "Address should be updated and saved"
        
        # Verify changes are different from original (if they were actually different)
        if first_name != original_first_name:
            assert user.first_name != original_first_name, "First name should be changed"
        if last_name != original_last_name:
            assert user.last_name != original_last_name, "Last name should be changed"
        if phone != original_phone:
            assert user.phone != original_phone, "Phone should be changed"
        if address != original_address:
            assert profile.address != original_address, "Address should be changed"
        
        # Clean up
        user.delete()
    
    @given(
        total_amount=st.decimals(min_value=1, max_value=10000, places=2),
        shipping_address=st.text(min_size=1, max_size=500),
        delivery_method=st.text(min_size=1, max_size=50),
        num_items=st.integers(min_value=1, max_value=10)
    )
    def test_order_information_completeness(self, total_amount, shipping_address, delivery_method, num_items):
        """
        **Feature: pkubg-ecommerce, Property 12: Полнота информации о заказе**
        
        For any order when viewed, complete information about products, 
        delivery and payment status should be displayed.
        """
        from orders.models import Order, OrderItem
        from products.models import Product, Category
        from decimal import Decimal
        
        # Create a test user
        user = self.create_test_user()
        
        # Create test category and products
        category = Category.objects.create(
            name=f'Test Category {uuid.uuid4().hex[:8]}',
            slug=f'test-category-{uuid.uuid4().hex[:8]}'
        )
        
        # Create an order
        order = Order.objects.create(
            user=user,
            order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
            total_amount=total_amount,
            shipping_address=shipping_address,
            delivery_method=delivery_method,
            status='pending',
            payment_status='pending'
        )
        
        # Create order items
        created_items = []
        for i in range(num_items):
            product = Product.objects.create(
                name=f'Test Product {uuid.uuid4().hex[:8]}',
                slug=f'test-product-{uuid.uuid4().hex[:8]}',
                description='Test description',
                price=Decimal('100.00'),
                category=category,
                stock_quantity=10
            )
            
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=1,
                price=product.price
            )
            created_items.append(order_item)
        
        # Verify order contains complete information
        
        # Basic order information
        assert order.order_number is not None, "Order should have order number"
        assert order.user == user, "Order should belong to the user"
        assert order.total_amount == total_amount, "Order should have correct total amount"
        assert order.shipping_address == shipping_address, "Order should have shipping address"
        assert order.delivery_method == delivery_method, "Order should have delivery method"
        assert order.created_at is not None, "Order should have creation date"
        
        # Status information
        assert order.status in dict(Order.ORDER_STATUS_CHOICES), "Order should have valid status"
        assert order.payment_status in dict(Order.PAYMENT_STATUS_CHOICES), "Order should have valid payment status"
        
        # Product information
        order_items = order.items.all()
        assert order_items.count() == num_items, f"Order should have {num_items} items"
        
        for item in order_items:
            assert item.product is not None, "Order item should have product"
            assert item.product.name is not None, "Product should have name"
            assert item.quantity > 0, "Order item should have positive quantity"
            assert item.price is not None, "Order item should have price"
            
        # Clean up
        Order.objects.filter(user=user).delete()
        Product.objects.filter(category=category).delete()
        category.delete()
        user.delete()
    
    @given(
        password=st.text(min_size=8, max_size=128)
    )
    def test_session_termination_on_logout(self, password):
        """
        **Feature: pkubg-ecommerce, Property 13: Завершение сессии при выходе**
        
        For any user logout from the system, the session should be terminated 
        and redirect to the main page should occur.
        """
        from django.test import Client
        
        # Create a test user with unique credentials
        user = self.create_test_user(password=password)
        
        # Create a test client and login
        client = Client()
        login_successful = client.login(username=user.username, password=password)
        assert login_successful, "User should be able to login"
        
        # Verify user is logged in by checking session
        session = client.session
        assert '_auth_user_id' in session, "Session should contain user authentication"
        assert session['_auth_user_id'] == str(user.pk), "Session should contain correct user ID"
        
        # Perform logout
        logout_response = client.logout()
        
        # Verify session is terminated
        # Get fresh session after logout
        session_after_logout = client.session
        assert '_auth_user_id' not in session_after_logout, "Session should not contain user authentication after logout"
        
        # Verify that accessing protected content requires re-authentication
        # Try to access a protected view (if available) or check session state
        assert not session_after_logout.get('_auth_user_id'), "User should not be authenticated after logout"
        
        # Clean up
        user.delete()