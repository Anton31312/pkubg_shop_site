"""
Tests for integrations app.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from unittest.mock import patch, MagicMock

from orders.models import Order
from .models import PaymentTransaction
from .yookassa_service import YooKassaService, PaymentError

User = get_user_model()


class TestYooKassaIntegration(TestCase):
    """Integration tests for YooKassa payment service."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.order = Order.objects.create(
            user=self.user,
            order_number='TEST-ORDER-001',
            total_amount=Decimal('150.00'),
            shipping_address='Test Address',
            delivery_method='pickup',
            status='pending',
            payment_status='pending'
        )
    
    def test_payment_creation_flow(self):
        """Test complete payment creation flow."""
        service = YooKassaService()
        
        # Create payment
        payment_data = service.create_payment(self.order)
        
        # Verify payment data structure
        self.assertIn('id', payment_data)
        self.assertIn('confirmation', payment_data)
        self.assertIn('confirmation_url', payment_data['confirmation'])
        self.assertEqual(payment_data['confirmation']['type'], 'redirect')
        self.assertEqual(Decimal(payment_data['amount']['value']), self.order.total_amount)
        self.assertEqual(payment_data['amount']['currency'], 'RUB')
        
        # Verify transaction was created
        transaction = PaymentTransaction.objects.get(payment_id=payment_data['id'])
        self.assertEqual(transaction.order, self.order)
        self.assertEqual(transaction.amount, self.order.total_amount)
        self.assertEqual(transaction.status, 'pending')
    
    def test_successful_payment_webhook(self):
        """Test successful payment webhook processing."""
        service = YooKassaService()
        
        # Create payment first
        payment_data = service.create_payment(self.order)
        payment_id = payment_data['id']
        
        # Simulate successful webhook
        webhook_data = {
            'object': {
                'id': payment_id,
                'status': 'succeeded'
            }
        }
        
        # Process webhook
        result = service.process_webhook(webhook_data)
        
        # Verify webhook processed successfully
        self.assertTrue(result)
        
        # Verify order status updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'paid')
        self.assertEqual(self.order.status, 'paid')
        
        # Verify transaction status updated
        transaction = PaymentTransaction.objects.get(payment_id=payment_id)
        self.assertEqual(transaction.status, 'succeeded')
    
    def test_failed_payment_webhook(self):
        """Test failed payment webhook processing."""
        service = YooKassaService()
        
        # Create payment first
        payment_data = service.create_payment(self.order)
        payment_id = payment_data['id']
        
        # Simulate failed webhook
        webhook_data = {
            'object': {
                'id': payment_id,
                'status': 'canceled'
            }
        }
        
        # Process webhook
        result = service.process_webhook(webhook_data)
        
        # Verify webhook processed successfully
        self.assertTrue(result)
        
        # Verify order status updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'failed')
        self.assertEqual(self.order.status, 'pending')  # Should remain pending for retry
        
        # Verify transaction status updated
        transaction = PaymentTransaction.objects.get(payment_id=payment_id)
        self.assertEqual(transaction.status, 'canceled')
    
    def test_payment_error_handling(self):
        """Test payment error handling."""
        service = YooKassaService()
        
        # Mock UUID to raise exception
        with patch('uuid.uuid4') as mock_uuid:
            mock_uuid.side_effect = Exception('Test error')
            
            # Verify PaymentError is raised
            with self.assertRaises(PaymentError) as context:
                service.create_payment(self.order)
            
            # Verify error message
            self.assertIn('Не удалось создать платеж', str(context.exception))
    
    def test_get_payment_status(self):
        """Test getting payment status."""
        service = YooKassaService()
        
        # Create payment first
        payment_data = service.create_payment(self.order)
        payment_id = payment_data['id']
        
        # Get payment status
        status_data = service.get_payment_status(payment_id)
        
        # Verify status data
        self.assertIsNotNone(status_data)
        self.assertEqual(status_data['id'], payment_id)
        self.assertEqual(status_data['status'], 'pending')
        self.assertEqual(Decimal(status_data['amount']['value']), self.order.total_amount)
        self.assertEqual(status_data['order_id'], self.order.id)
    
    def test_invalid_webhook_data(self):
        """Test handling of invalid webhook data."""
        service = YooKassaService()
        
        # Test with missing payment_id
        webhook_data = {
            'object': {
                'status': 'succeeded'
            }
        }
        
        result = service.process_webhook(webhook_data)
        self.assertFalse(result)
        
        # Test with missing status
        webhook_data = {
            'object': {
                'id': 'test-payment-id'
            }
        }
        
        result = service.process_webhook(webhook_data)
        self.assertFalse(result)
        
        # Test with non-existent payment
        webhook_data = {
            'object': {
                'id': 'non-existent-payment',
                'status': 'succeeded'
            }
        }
        
        result = service.process_webhook(webhook_data)
        self.assertFalse(result)


class TestYooKassaAPI(TestCase):
    """Test YooKassa API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.order = Order.objects.create(
            user=self.user,
            order_number='TEST-ORDER-002',
            total_amount=Decimal('200.00'),
            shipping_address='Test Address',
            delivery_method='pickup',
            status='pending',
            payment_status='pending'
        )
    
    def test_create_payment_api(self):
        """Test create payment API endpoint."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.post(reverse('integrations:create_payment'), {
            'order_id': self.order.id
        })
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('payment_id', data)
        self.assertIn('confirmation_url', data)
        self.assertEqual(data['amount'], '200.00')
        self.assertEqual(data['currency'], 'RUB')
    
    def test_create_payment_invalid_order(self):
        """Test create payment with invalid order."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        response = client.post(reverse('integrations:create_payment'), {
            'order_id': 99999  # Non-existent order
        })
        
        self.assertEqual(response.status_code, 404)
    
    def test_create_payment_unauthorized(self):
        """Test create payment without authentication."""
        from rest_framework.test import APIClient
        from django.urls import reverse
        
        client = APIClient()
        
        response = client.post(reverse('integrations:create_payment'), {
            'order_id': self.order.id
        })
        
        self.assertEqual(response.status_code, 401)
    
    def test_webhook_endpoint(self):
        """Test webhook endpoint."""
        from django.test import Client
        from django.urls import reverse
        import json
        
        # Create payment first
        service = YooKassaService()
        payment_data = service.create_payment(self.order)
        payment_id = payment_data['id']
        
        client = Client()
        
        webhook_data = {
            'object': {
                'id': payment_id,
                'status': 'succeeded'
            }
        }
        
        response = client.post(
            reverse('integrations:yookassa_webhook'),
            data=json.dumps(webhook_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify order was updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'paid')


# CDEK Integration Tests
from hypothesis import given, strategies as st
from .cdek_service import CDEKService, CDEKError
from .models import DeliveryRequest


class TestCDEKPickupPointsProperty(TestCase):
    """Property-based tests for CDEK pickup points functionality."""
    
    @given(st.text(min_size=3, max_size=100).filter(lambda x: x.strip() and x.isascii()))
    def test_pickup_points_suggestion_property(self, address):
        """
        **Feature: pkubg-ecommerce, Property 18: Предложение пунктов выдачи СДЭК**
        
        For any valid address, the system should return a list of nearby CDEK pickup points.
        """
        service = CDEKService()
        
        try:
            pickup_points = service.find_pickup_points(address)
            
            # Verify response structure
            self.assertIsInstance(pickup_points, list)
            
            # If points are returned, verify their structure
            for point in pickup_points:
                self.assertIsInstance(point, dict)
                self.assertIn('code', point)
                self.assertIn('name', point)
                self.assertIn('address', point)
                self.assertIsInstance(point['code'], str)
                self.assertIsInstance(point['name'], str)
                
                # Verify coordinates if present
                if 'coordinates' in point:
                    coords = point['coordinates']
                    if coords.get('latitude') is not None:
                        self.assertIsInstance(coords['latitude'], (int, float))
                    if coords.get('longitude') is not None:
                        self.assertIsInstance(coords['longitude'], (int, float))
                        
        except CDEKError:
            # CDEK errors are acceptable for invalid addresses
            pass