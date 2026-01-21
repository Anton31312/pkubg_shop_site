"""
YooKassa payment service integration.
"""
import uuid
import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings
from django.urls import reverse
from .models import PaymentTransaction

logger = logging.getLogger(__name__)


class YooKassaService:
    """Service for YooKassa payment integration."""
    
    def __init__(self):
        self.shop_id = getattr(settings, 'YOOKASSA_SHOP_ID', 'test_shop_id')
        self.secret_key = getattr(settings, 'YOOKASSA_SECRET_KEY', 'test_secret_key')
        self.base_url = getattr(settings, 'YOOKASSA_BASE_URL', 'https://api.yookassa.ru/v3')
    
    def create_payment(self, order, return_url: str = None) -> Dict[str, Any]:
        """
        Create payment in YooKassa system.
        
        Args:
            order: Order instance
            return_url: URL to redirect user after payment
            
        Returns:
            Dict with payment data including confirmation URL
        """
        try:
            # Generate unique payment ID
            payment_id = str(uuid.uuid4())
            
            # Create payment transaction record
            transaction = PaymentTransaction.objects.create(
                order=order,
                payment_id=payment_id,
                amount=order.total_amount,
                currency='RUB',
                status='pending'
            )
            
            # In real implementation, this would call YooKassa API
            # For now, we simulate the response
            payment_data = {
                'id': payment_id,
                'status': 'pending',
                'amount': {
                    'value': str(order.total_amount),
                    'currency': 'RUB'
                },
                'confirmation': {
                    'type': 'redirect',
                    'confirmation_url': f'https://yookassa.ru/checkout/{payment_id}'
                },
                'description': f'Оплата заказа {order.order_number}',
                'metadata': {
                    'order_id': str(order.id),
                    'order_number': order.order_number
                }
            }
            
            logger.info(f"Payment created: {payment_id} for order {order.order_number}")
            return payment_data
            
        except Exception as e:
            logger.error(f"Payment creation failed for order {order.order_number}: {str(e)}")
            raise PaymentError(f"Не удалось создать платеж: {str(e)}")
    
    def process_webhook(self, webhook_data: Dict[str, Any]) -> bool:
        """
        Process webhook notification from YooKassa.
        
        Args:
            webhook_data: Webhook payload from YooKassa
            
        Returns:
            True if processed successfully, False otherwise
        """
        try:
            payment_id = webhook_data.get('object', {}).get('id')
            status = webhook_data.get('object', {}).get('status')
            
            if not payment_id or not status:
                logger.error("Invalid webhook data: missing payment_id or status")
                return False
            
            # Find payment transaction
            try:
                transaction = PaymentTransaction.objects.get(payment_id=payment_id)
            except PaymentTransaction.DoesNotExist:
                logger.error(f"Payment transaction not found: {payment_id}")
                return False
            
            # Update transaction status
            old_status = transaction.status
            transaction.status = self._map_yookassa_status(status)
            transaction.save()
            
            # Update order status based on payment status
            order = transaction.order
            if transaction.status == 'succeeded':
                order.payment_status = 'paid'
                order.status = 'paid'
                order.save()
                logger.info(f"Order {order.order_number} marked as paid")
            elif transaction.status == 'canceled':
                order.payment_status = 'failed'
                order.save()
                logger.info(f"Order {order.order_number} payment failed")
            
            logger.info(f"Payment {payment_id} status updated: {old_status} -> {transaction.status}")
            return True
            
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            return False
    
    def _map_yookassa_status(self, yookassa_status: str) -> str:
        """Map YooKassa status to internal status."""
        status_mapping = {
            'pending': 'pending',
            'waiting_for_capture': 'waiting_for_capture',
            'succeeded': 'succeeded',
            'canceled': 'canceled'
        }
        return status_mapping.get(yookassa_status, 'pending')
    
    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Get payment status from YooKassa.
        
        Args:
            payment_id: Payment ID
            
        Returns:
            Payment status data or None if not found
        """
        try:
            transaction = PaymentTransaction.objects.get(payment_id=payment_id)
            
            # In real implementation, this would call YooKassa API
            # For now, we return stored data
            return {
                'id': payment_id,
                'status': transaction.status,
                'amount': {
                    'value': str(transaction.amount),
                    'currency': transaction.currency
                },
                'order_id': transaction.order.id
            }
            
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Payment not found: {payment_id}")
            return None
        except Exception as e:
            logger.error(f"Failed to get payment status: {str(e)}")
            return None


class PaymentError(Exception):
    """Custom exception for payment errors."""
    pass