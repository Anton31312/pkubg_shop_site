"""
Tests for analytics app.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from hypothesis import given, strategies as st
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from orders.models import Cart, CartItem
from products.models import Product, Category

User = get_user_model()


class TestAnalyticsBasic(TestCase):
    """Basic tests for analytics functionality."""
    
    def test_analytics_app_ready(self):
        """Test that analytics app is properly configured."""
        from django.apps import apps
        app = apps.get_app_config('analytics')
        self.assertEqual(app.name, 'analytics')


@pytest.mark.property_tests
class TestAnalyticsProperties:
    """Property-based tests for analytics functionality."""
    
    def setUp(self):
        """Set up test data."""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='admin'
        )
        
        # Create category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    @given(st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=100),  # quantity
            st.decimals(min_value=Decimal('1.00'), max_value=Decimal('1000.00'), places=2)  # price
        ),
        min_size=1,
        max_size=10
    ))
    def test_total_items_count_property(self, cart_data):
        """
        **Feature: pkubg-ecommerce, Property 36: Отображение общего количества товаров в корзинах**
        
        For any set of carts with items, the analytics should correctly display
        the total count of all items across all active carts.
        """
        # Clean up any existing data
        Cart.objects.all().delete()
        Product.objects.all().delete()
        
        # Create users and carts
        users = []
        carts = []
        expected_total_items = 0
        
        for i, (quantity, price) in enumerate(cart_data):
            # Create user
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123'
            )
            users.append(user)
            
            # Create product
            product = Product.objects.create(
                name=f'Product {i}',
                slug=f'product-{i}',
                description=f'Test product {i}',
                price=price,
                category=self.category,
                stock_quantity=100
            )
            
            # Create cart and add item
            cart = Cart.objects.create(user=user)
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
            carts.append(cart)
            expected_total_items += quantity
        
        # Get analytics data
        response = self.client.get('/api/analytics/cart-stats/')
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Property: Total items should equal sum of all quantities
        assert data['total_items'] == expected_total_items
        assert data['total_carts'] == len(cart_data)
        
        # Clean up
        for user in users:
            user.delete()
    
    @given(st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=50),  # quantity
            st.decimals(min_value=Decimal('1.00'), max_value=Decimal('500.00'), places=2)  # price
        ),
        min_size=1,
        max_size=5
    ))
    def test_total_value_calculation_property(self, cart_data):
        """
        **Feature: pkubg-ecommerce, Property 37: Расчет общей суммы корзин**
        
        For any set of carts, the analytics should correctly calculate
        the total value of all items across all carts.
        """
        # Clean up any existing data
        Cart.objects.all().delete()
        Product.objects.all().delete()
        
        # Create users and carts
        users = []
        expected_total_value = Decimal('0.00')
        
        for i, (quantity, price) in enumerate(cart_data):
            # Create user
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123'
            )
            users.append(user)
            
            # Create product
            product = Product.objects.create(
                name=f'Product {i}',
                slug=f'product-{i}',
                description=f'Test product {i}',
                price=price,
                category=self.category,
                stock_quantity=100
            )
            
            # Create cart and add item
            cart = Cart.objects.create(user=user)
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
            
            expected_total_value += price * quantity
        
        # Get analytics data
        response = self.client.get('/api/analytics/cart-stats/')
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Property: Total value should equal sum of all (price * quantity)
        assert abs(Decimal(str(data['total_value'])) - expected_total_value) < Decimal('0.01')
        
        # Clean up
        for user in users:
            user.delete()
    
    @given(st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=20),  # initial quantity
            st.integers(min_value=1, max_value=10),  # additional quantity
            st.decimals(min_value=Decimal('1.00'), max_value=Decimal('100.00'), places=2)  # price
        ),
        min_size=1,
        max_size=3
    ))
    def test_real_time_update_property(self, cart_changes):
        """
        **Feature: pkubg-ecommerce, Property 38: Обновления статистики при изменении корзин**
        
        For any changes to cart contents, the analytics should update in real-time
        to reflect the new totals.
        """
        # Clean up any existing data
        Cart.objects.all().delete()
        Product.objects.all().delete()
        
        users = []
        carts = []
        products = []
        
        # Create initial carts
        for i, (initial_qty, additional_qty, price) in enumerate(cart_changes):
            # Create user
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123'
            )
            users.append(user)
            
            # Create product
            product = Product.objects.create(
                name=f'Product {i}',
                slug=f'product-{i}',
                description=f'Test product {i}',
                price=price,
                category=self.category,
                stock_quantity=100
            )
            products.append(product)
            
            # Create cart with initial quantity
            cart = Cart.objects.create(user=user)
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=initial_qty
            )
            carts.append(cart)
        
        # Get initial analytics
        response1 = self.client.get('/api/analytics/cart-stats/')
        assert response1.status_code == status.HTTP_200_OK
        initial_data = response1.json()
        
        # Modify carts by adding more items
        for i, (initial_qty, additional_qty, price) in enumerate(cart_changes):
            cart = carts[i]
            product = products[i]
            cart_item = cart.items.get(product=product)
            cart_item.quantity += additional_qty
            cart_item.save()
        
        # Get updated analytics
        response2 = self.client.get('/api/analytics/real-time-cart-stats/')
        assert response2.status_code == status.HTTP_200_OK
        updated_data = response2.json()
        
        # Property: Updated totals should reflect the changes
        expected_additional_items = sum(additional_qty for _, additional_qty, _ in cart_changes)
        expected_additional_value = sum(
            Decimal(str(additional_qty)) * price 
            for _, additional_qty, price in cart_changes
        )
        
        assert updated_data['total_items'] == initial_data['total_items'] + expected_additional_items
        assert abs(
            Decimal(str(updated_data['total_value'])) - 
            (Decimal(str(initial_data['total_value'])) + expected_additional_value)
        ) < Decimal('0.01')
        
        # Clean up
        for user in users:
            user.delete()
    
    @given(st.lists(
        st.tuples(
            st.integers(min_value=2, max_value=10),  # quantity to remove some
            st.decimals(min_value=Decimal('1.00'), max_value=Decimal('100.00'), places=2)  # price
        ),
        min_size=1,
        max_size=3
    ))
    def test_removal_update_property(self, cart_data):
        """
        **Feature: pkubg-ecommerce, Property 39: Пересчет статистики при удалении из корзин**
        
        For any removal of items from carts, the analytics should correctly
        recalculate the totals.
        """
        # Clean up any existing data
        Cart.objects.all().delete()
        Product.objects.all().delete()
        
        users = []
        carts = []
        products = []
        
        # Create carts with items
        for i, (quantity, price) in enumerate(cart_data):
            # Create user
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123'
            )
            users.append(user)
            
            # Create product
            product = Product.objects.create(
                name=f'Product {i}',
                slug=f'product-{i}',
                description=f'Test product {i}',
                price=price,
                category=self.category,
                stock_quantity=100
            )
            products.append(product)
            
            # Create cart with items
            cart = Cart.objects.create(user=user)
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
            carts.append(cart)
        
        # Get initial analytics
        response1 = self.client.get('/api/analytics/cart-stats/')
        assert response1.status_code == status.HTTP_200_OK
        initial_data = response1.json()
        
        # Remove some items from each cart (remove 1 item from each)
        removed_items = 0
        removed_value = Decimal('0.00')
        
        for i, (quantity, price) in enumerate(cart_data):
            if quantity > 1:  # Only remove if we have more than 1 item
                cart = carts[i]
                product = products[i]
                cart_item = cart.items.get(product=product)
                cart_item.quantity -= 1
                cart_item.save()
                removed_items += 1
                removed_value += price
        
        # Get updated analytics
        response2 = self.client.get('/api/analytics/cart-stats/')
        assert response2.status_code == status.HTTP_200_OK
        updated_data = response2.json()
        
        # Property: Totals should decrease by the removed amounts
        assert updated_data['total_items'] == initial_data['total_items'] - removed_items
        assert abs(
            Decimal(str(updated_data['total_value'])) - 
            (Decimal(str(initial_data['total_value'])) - removed_value)
        ) < Decimal('0.01')
        
        # Clean up
        for user in users:
            user.delete()
    
    @given(st.lists(
        st.tuples(
            st.integers(min_value=1, max_value=5),  # quantity
            st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2)  # price
        ),
        min_size=1,
        max_size=3
    ))
    def test_order_exclusion_property(self, cart_data):
        """
        **Feature: pkubg-ecommerce, Property 40: Исключение заказов из статистики корзин**
        
        For any cart that gets converted to an order, it should be excluded
        from the active cart statistics.
        """
        # Clean up any existing data
        Cart.objects.all().delete()
        Product.objects.all().delete()
        
        from orders.models import Order, OrderItem
        
        users = []
        carts = []
        products = []
        
        # Create carts with items
        for i, (quantity, price) in enumerate(cart_data):
            # Create user
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='testpass123'
            )
            users.append(user)
            
            # Create product
            product = Product.objects.create(
                name=f'Product {i}',
                slug=f'product-{i}',
                description=f'Test product {i}',
                price=price,
                category=self.category,
                stock_quantity=100
            )
            products.append(product)
            
            # Create cart with items
            cart = Cart.objects.create(user=user)
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
            carts.append(cart)
        
        # Get initial analytics (all carts active)
        response1 = self.client.get('/api/analytics/cart-stats/')
        assert response1.status_code == status.HTTP_200_OK
        initial_data = response1.json()
        
        # Convert first cart to order (simulate checkout)
        if carts:
            first_cart = carts[0]
            first_user = users[0]
            
            # Create order from cart
            order = Order.objects.create(
                user=first_user,
                order_number=f'ORDER-{first_user.id}-001',
                total_amount=first_cart.total_amount,
                shipping_address='Test Address',
                delivery_method='pickup'
            )
            
            # Create order items from cart items
            for cart_item in first_cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )
            
            # Clear the cart (simulate post-checkout cleanup)
            first_cart.items.all().delete()
        
        # Get updated analytics (should exclude converted cart)
        response2 = self.client.get('/api/analytics/cart-stats/')
        assert response2.status_code == status.HTTP_200_OK
        updated_data = response2.json()
        
        # Property: Analytics should exclude empty carts (converted to orders)
        if len(cart_data) > 1:
            # If we had multiple carts, one should be excluded now
            assert updated_data['total_carts'] == initial_data['total_carts'] - 1
            
            # Calculate expected values after removing first cart
            first_quantity, first_price = cart_data[0]
            expected_items = initial_data['total_items'] - first_quantity
            expected_value = Decimal(str(initial_data['total_value'])) - (first_price * first_quantity)
            
            assert updated_data['total_items'] == expected_items
            assert abs(Decimal(str(updated_data['total_value'])) - expected_value) < Decimal('0.01')
        else:
            # If we only had one cart, it should now show zero
            assert updated_data['total_carts'] == 0
            assert updated_data['total_items'] == 0
            assert updated_data['total_value'] == 0.0
        
        # Clean up
        for user in users:
            user.delete()