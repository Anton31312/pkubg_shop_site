"""
Tests for orders app.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from hypothesis import given, strategies as st
from decimal import Decimal

from .models import Cart, CartItem
from products.models import Product, Category

User = get_user_model()


class TestOrdersBasic(TestCase):
    """Basic tests for orders functionality."""
    
    def test_orders_app_ready(self):
        """Test that orders app is properly configured."""
        from django.apps import apps
        app = apps.get_app_config('orders')
        self.assertEqual(app.name, 'orders')
    
    def test_cart_basic_functionality(self):
        """Test basic cart functionality."""
        # Create test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test category and product
        category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test description',
            price=Decimal('100.00'),
            category=category,
            stock_quantity=10
        )
        
        # Create cart
        cart = Cart.objects.create(user=user)
        
        # Test initial state
        self.assertEqual(cart.total_items, 0)
        self.assertEqual(cart.total_amount, Decimal('0.00'))
        
        # Add item to cart
        cart.add_item(product, 2)
        
        # Test updated state
        self.assertEqual(cart.total_items, 2)
        self.assertEqual(cart.total_amount, Decimal('200.00'))
        
        # Add same item again
        cart.add_item(product, 1)
        
        # Test accumulated state
        self.assertEqual(cart.total_items, 3)
        self.assertEqual(cart.total_amount, Decimal('300.00'))
        
        # Remove item
        cart.remove_item(product)
        
        # Test removal
        self.assertEqual(cart.total_items, 0)
        self.assertEqual(cart.total_amount, Decimal('0.00'))


class TestCartAPI(TestCase):
    """Test cart API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            description='Test description',
            price=Decimal('100.00'),
            category=self.category,
            stock_quantity=10
        )
    
    def test_get_empty_cart(self):
        """Test getting empty cart."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.get(reverse('orders:get_cart'))
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total_items'], 0)
        self.assertEqual(data['total_amount'], 0.0)
        self.assertEqual(len(data['items']), 0)
    
    def test_add_to_cart(self):
        """Test adding item to cart."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.post(reverse('orders:add_to_cart'), {
            'product_id': self.product.id,
            'quantity': 2
        })
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total_items'], 2)
        self.assertEqual(data['total_amount'], 200.0)
    
    def test_update_cart_item(self):
        """Test updating cart item quantity."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        # First add item
        client.post(reverse('orders:add_to_cart'), {
            'product_id': self.product.id,
            'quantity': 2
        })
        
        # Then update quantity
        response = client.put(reverse('orders:update_cart_item'), {
            'product_id': self.product.id,
            'quantity': 5
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total_items'], 5)
        self.assertEqual(data['total_amount'], 500.0)
    
    def test_remove_from_cart(self):
        """Test removing item from cart."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        # First add item
        client.post(reverse('orders:add_to_cart'), {
            'product_id': self.product.id,
            'quantity': 2
        })
        
        # Then remove item
        response = client.delete(reverse('orders:remove_from_cart', args=[self.product.id]))
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total_items'], 0)
        self.assertEqual(data['total_amount'], 0.0)


@pytest.mark.django_db(transaction=True)
@pytest.mark.property_tests
class TestCartProperties:
    """Property-based tests for cart functionality."""
    
    def create_test_user(self):
        """Create a test user."""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        return User.objects.create_user(
            username=f'testuser_{unique_id}',
            email=f'test_{unique_id}@example.com',
            password='testpass123'
        )
    
    def create_test_product(self, price=100.00, stock=10):
        """Create a test product."""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        # Create category for this product
        category = Category.objects.create(
            name=f'Test Category {unique_id}',
            slug=f'test-category-{unique_id}'
        )
        
        return Product.objects.create(
            name=f'Test Product {unique_id}',
            slug=f'test-product-{unique_id}',
            description='Test description',
            price=Decimal(str(price)),
            category=category,
            stock_quantity=stock
        )
    
    @given(st.lists(st.integers(min_value=1, max_value=100), min_size=1, max_size=10))
    def test_cart_counter_update_on_add(self, quantities):
        """
        **Feature: pkubg-ecommerce, Property 5: Обновление счетчика корзины при добавлении**
        """
        # Create test data
        user = self.create_test_user()
        cart = Cart.objects.create(user=user)
        
        # Track initial count
        initial_count = cart.total_items
        
        # Add items with different quantities
        total_added = 0
        for i, quantity in enumerate(quantities):
            product = self.create_test_product(price=100.00 + i)
            cart.add_item(product, quantity)
            total_added += quantity
        
        # Verify counter increased by correct amount
        assert cart.total_items == initial_count + total_added
    
    @given(st.lists(st.tuples(st.floats(min_value=1.0, max_value=1000.0), 
                              st.integers(min_value=1, max_value=100)), 
                    min_size=1, max_size=10))
    def test_cart_total_update_on_add(self, price_quantity_pairs):
        """
        **Feature: pkubg-ecommerce, Property 6: Обновление суммы корзины при добавлении**
        """
        # Create test data
        user = self.create_test_user()
        cart = Cart.objects.create(user=user)
        
        # Track initial total
        initial_total = cart.total_amount
        
        # Add items and calculate expected total
        expected_addition = Decimal('0.00')
        for i, (price, quantity) in enumerate(price_quantity_pairs):
            product = self.create_test_product(price=price)
            cart.add_item(product, quantity)
            expected_addition += Decimal(str(price)) * quantity
        
        # Verify total increased by correct amount
        assert cart.total_amount == initial_total + expected_addition
    
    @given(st.lists(st.tuples(st.floats(min_value=1.0, max_value=1000.0), 
                              st.integers(min_value=1, max_value=100)), 
                    min_size=1, max_size=10))
    def test_cart_recalculation_on_quantity_change(self, price_quantity_pairs):
        """
        **Feature: pkubg-ecommerce, Property 7: Пересчет стоимости при изменении количества**
        """
        # Create test data
        user = self.create_test_user()
        cart = Cart.objects.create(user=user)
        
        # Add items to cart
        products = []
        for i, (price, quantity) in enumerate(price_quantity_pairs):
            product = self.create_test_product(price=price)
            cart.add_item(product, quantity)
            products.append((product, quantity))
        
        # Calculate expected total manually
        expected_total = sum(Decimal(str(price)) * quantity 
                           for (price, quantity) in price_quantity_pairs)
        
        # Verify total equals sum of price * quantity for all items
        assert cart.total_amount == expected_total
    
    @given(st.lists(st.tuples(st.floats(min_value=1.0, max_value=1000.0), 
                              st.integers(min_value=1, max_value=100)), 
                    min_size=2, max_size=10))
    def test_cart_update_on_item_removal(self, price_quantity_pairs):
        """
        **Feature: pkubg-ecommerce, Property 8: Обновление корзины при удалении товара**
        """
        # Create test data
        user = self.create_test_user()
        cart = Cart.objects.create(user=user)
        
        # Add items to cart
        products = []
        for i, (price, quantity) in enumerate(price_quantity_pairs):
            product = self.create_test_product(price=price)
            cart.add_item(product, quantity)
            products.append((product, price, quantity))
        
        # Remove first item
        product_to_remove, removed_price, removed_quantity = products[0]
        initial_count = cart.total_items
        initial_total = cart.total_amount
        
        cart.remove_item(product_to_remove)
        
        # Verify counter and total decreased by correct amounts
        assert cart.total_items == initial_count - removed_quantity
        assert cart.total_amount == initial_total - (Decimal(str(removed_price)) * removed_quantity)


@pytest.mark.django_db(transaction=True)
@pytest.mark.property_tests
class TestYooKassaPaymentProperties:
    """Property-based tests for YooKassa payment integration."""
    
    def create_test_user(self):
        """Create a test user."""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        return User.objects.create_user(
            username=f'testuser_{unique_id}',
            email=f'test_{unique_id}@example.com',
            password='testpass123'
        )
    
    def create_test_order(self, user, amount=100.00):
        """Create a test order."""
        import uuid
        from orders.models import Order
        
        return Order.objects.create(
            user=user,
            order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
            total_amount=Decimal(str(amount)),
            shipping_address='Test Address',
            delivery_method='pickup',
            status='pending',
            payment_status='pending'
        )
    
    @given(st.floats(min_value=1.0, max_value=10000.0))
    def test_payment_redirect_correctness(self, order_amount):
        """
        **Feature: pkubg-ecommerce, Property 14: Корректность перенаправления на оплату**
        """
        from integrations.yookassa_service import YooKassaService
        
        # Create test data
        user = self.create_test_user()
        order = self.create_test_order(user, order_amount)
        
        # Create payment
        service = YooKassaService()
        payment_data = service.create_payment(order)
        
        # Verify payment data contains required fields for redirect
        assert 'id' in payment_data
        assert 'confirmation' in payment_data
        assert 'confirmation_url' in payment_data['confirmation']
        assert payment_data['confirmation']['type'] == 'redirect'
        
        # Verify amount matches order
        assert Decimal(payment_data['amount']['value']) == Decimal(str(order_amount))
        assert payment_data['amount']['currency'] == 'RUB'
        
        # Verify metadata contains order information
        assert 'metadata' in payment_data
        assert payment_data['metadata']['order_id'] == str(order.id)
        assert payment_data['metadata']['order_number'] == order.order_number
        
        # Verify confirmation URL is valid format
        confirmation_url = payment_data['confirmation']['confirmation_url']
        assert confirmation_url.startswith('https://yookassa.ru/checkout/')
        assert payment_data['id'] in confirmation_url
    
    @given(st.text(min_size=1, max_size=100, alphabet=st.characters(min_codepoint=32, max_codepoint=126)))
    def test_payment_status_update_on_success(self, payment_id_suffix):
        """
        **Feature: pkubg-ecommerce, Property 15: Обновление статуса при успешной оплате**
        """
        from integrations.yookassa_service import YooKassaService
        from integrations.models import PaymentTransaction
        import uuid
        
        # Create test data
        user = self.create_test_user()
        order = self.create_test_order(user)
        
        # Create payment transaction with unique ID
        unique_id = str(uuid.uuid4())[:8]
        payment_id = f'payment_{unique_id}_{payment_id_suffix.replace(" ", "_")}'
        transaction = PaymentTransaction.objects.create(
            order=order,
            payment_id=payment_id,
            amount=order.total_amount,
            currency='RUB',
            status='pending'
        )
        
        # Simulate successful payment webhook
        webhook_data = {
            'object': {
                'id': payment_id,
                'status': 'succeeded'
            }
        }
        
        service = YooKassaService()
        success = service.process_webhook(webhook_data)
        
        # Verify webhook processed successfully
        assert success is True
        
        # Verify transaction status updated
        transaction.refresh_from_db()
        assert transaction.status == 'succeeded'
        
        # Verify order status updated
        order.refresh_from_db()
        assert order.payment_status == 'paid'
        assert order.status == 'paid'
    
    @given(st.text(min_size=1, max_size=100, alphabet=st.characters(min_codepoint=32, max_codepoint=126)))
    def test_payment_failure_notification(self, payment_id_suffix):
        """
        **Feature: pkubg-ecommerce, Property 16: Уведомление при отклонении оплаты**
        """
        from integrations.yookassa_service import YooKassaService
        from integrations.models import PaymentTransaction
        import uuid
        
        # Create test data
        user = self.create_test_user()
        order = self.create_test_order(user)
        
        # Create payment transaction with unique ID
        unique_id = str(uuid.uuid4())[:8]
        payment_id = f'payment_{unique_id}_{payment_id_suffix.replace(" ", "_")}'
        transaction = PaymentTransaction.objects.create(
            order=order,
            payment_id=payment_id,
            amount=order.total_amount,
            currency='RUB',
            status='pending'
        )
        
        # Simulate failed payment webhook
        webhook_data = {
            'object': {
                'id': payment_id,
                'status': 'canceled'
            }
        }
        
        service = YooKassaService()
        success = service.process_webhook(webhook_data)
        
        # Verify webhook processed successfully
        assert success is True
        
        # Verify transaction status updated to canceled
        transaction.refresh_from_db()
        assert transaction.status == 'canceled'
        
        # Verify order payment status updated to failed
        order.refresh_from_db()
        assert order.payment_status == 'failed'
        
        # Order status should remain pending (not changed to failed)
        # This allows for retry attempts
        assert order.status == 'pending'
    
    @given(st.text(min_size=1, max_size=100, alphabet=st.characters(min_codepoint=32, max_codepoint=126)))
    def test_payment_error_logging(self, error_message):
        """
        **Feature: pkubg-ecommerce, Property 17: Логирование ошибок платежей**
        """
        from integrations.yookassa_service import YooKassaService, PaymentError
        import logging
        from unittest.mock import patch
        import uuid
        
        # Create test data
        user = self.create_test_user()
        order = self.create_test_order(user)
        
        # Mock logger to capture log messages
        with patch('integrations.yookassa_service.logger') as mock_logger:
            # Simulate error during payment creation by patching UUID generation
            with patch('uuid.uuid4') as mock_uuid:
                mock_uuid.side_effect = Exception(error_message)
                
                service = YooKassaService()
                
                # Verify that PaymentError is raised
                with pytest.raises(PaymentError) as exc_info:
                    service.create_payment(order)
                
                # Verify error message contains our test message
                assert error_message in str(exc_info.value) or "Не удалось создать платеж" in str(exc_info.value)
                
                # Verify error was logged
                mock_logger.error.assert_called()
                
                # Get the logged error message
                logged_calls = mock_logger.error.call_args_list
                assert len(logged_calls) > 0
                
                # Verify the log contains order information and error details
                log_message = str(logged_calls[0])
                assert order.order_number in log_message or "Payment creation failed" in log_message