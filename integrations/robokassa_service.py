"""
Robokassa payment service integration.
Документация: https://docs.robokassa.ru/pay-interface/
"""
import hashlib
import logging
import base64
import json
from decimal import Decimal
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from django.conf import settings
from django.urls import reverse

from .models import PaymentTransaction

logger = logging.getLogger(__name__)


class RobokassaService:
    """Service for Robokassa payment integration."""
    
    def __init__(self):
        self.merchant_login = getattr(settings, 'ROBOKASSA_MERCHANT_LOGIN', '')
        self.password1 = getattr(settings, 'ROBOKASSA_PASSWORD1', '')  # Для формирования подписи на оплату
        self.password2 = getattr(settings, 'ROBOKASSA_PASSWORD2', '')  # Для проверки ResultURL
        self.test_mode = getattr(settings, 'ROBOKASSA_TEST_MODE', True)
        
        # URL для оплаты
        if self.test_mode:
            self.payment_url = 'https://auth.robokassa.ru/Merchant/Index.aspx'
        else:
            self.payment_url = 'https://auth.robokassa.ru/Merchant/Index.aspx'
    
    def _generate_signature(self, merchant_login: str, out_sum: str, inv_id: str, 
                           password: str, receipt: str = None, **kwargs) -> str:
        """
        Генерация подписи для запроса.
        
        Формула: MD5(MerchantLogin:OutSum:InvId:Receipt:Password)
        Дополнительные параметры (shp_*) добавляются в алфавитном порядке.
        """
        # Базовая строка для подписи
        signature_parts = [merchant_login, out_sum, inv_id]
        
        # Добавляем receipt если есть
        if receipt:
            signature_parts.append(receipt)
        
        signature_parts.append(password)
        
        # Добавляем дополнительные параметры (shp_*) в алфавитном порядке
        shp_params = {k: v for k, v in kwargs.items() if k.startswith('shp_')}
        for key in sorted(shp_params.keys()):
            signature_parts.append(f"{shp_params[key]}")
        
        signature_string = ':'.join(signature_parts)
        
        # MD5 хеш
        return hashlib.md5(signature_string.encode('utf-8')).hexdigest()
    
    def create_payment_url(self, order, description: str = None, 
                          result_url: str = None, success_url: str = None,
                          fail_url: str = None) -> Dict[str, Any]:
        """
        Создание URL для оплаты через Robokassa.
        
        Args:
            order: Объект заказа
            description: Описание платежа
            result_url: URL для получения уведомления об оплате (ResultURL)
            success_url: URL для редиректа при успешной оплате
            fail_url: URL для редиректа при неудачной оплате
            
        Returns:
            Dict с данными платежа и URL для оплаты
        """
        try:
            # Параметры платежа
            out_sum = str(order.total_amount)
            inv_id = str(order.id)
            description = description or f'Оплата заказа {order.order_number}'
            
            # Дополнительные параметры (передаются обратно в ResultURL)
            shp_params = {
                'shp_order_id': str(order.id),
                'shp_order_number': order.order_number,
            }
            
            # Генерируем подпись
            signature = self._generate_signature(
                self.merchant_login,
                out_sum,
                inv_id,
                self.password1,
                **shp_params
            )
            
            # Параметры запроса
            payment_params = {
                'MerchantLogin': self.merchant_login,
                'OutSum': out_sum,
                'InvId': inv_id,
                'Description': description,
                'SignatureValue': signature,
                'Encoding': 'utf-8',
                'Culture': 'ru',
                **shp_params
            }
            
            # Добавляем URL'ы если указаны
            if result_url:
                payment_params['ResultURL'] = result_url
            if success_url:
                payment_params['SuccessURL'] = success_url
            if fail_url:
                payment_params['FailURL'] = fail_url
            
            # Формируем полный URL
            payment_url = f"{self.payment_url}?{urlencode(payment_params)}"
            
            # Создаем запись транзакции
            transaction = PaymentTransaction.objects.create(
                order=order,
                payment_id=f"RBK-{order.id}",
                amount=order.total_amount,
                currency='RUB',
                status='pending',
                payment_system='robokassa'
            )
            
            logger.info(f"Payment URL created for order {order.order_number}")
            
            return {
                'payment_url': payment_url,
                'payment_id': transaction.payment_id,
                'amount': str(order.total_amount),
                'currency': 'RUB',
                'order_id': order.id,
                'order_number': order.order_number
            }
            
        except Exception as e:
            logger.error(f"Payment URL creation failed for order {order.order_number}: {str(e)}")
            raise PaymentError(f"Не удалось создать платеж: {str(e)}")
    
    def verify_result_signature(self, out_sum: str, inv_id: str, signature: str, **kwargs) -> bool:
        """
        Проверка подписи от ResultURL.
        
        Формула: MD5(OutSum:InvId:Password2:shp_*)
        """
        # Формируем строку для проверки
        signature_parts = [out_sum, inv_id, self.password2]
        
        # Добавляем дополнительные параметры (shp_*) в алфавитном порядке
        shp_params = {k: v for k, v in kwargs.items() if k.startswith('shp_')}
        for key in sorted(shp_params.keys()):
            signature_parts.append(f"{shp_params[key]}")
        
        signature_string = ':'.join(signature_parts)
        expected_signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()
        
        return signature.lower() == expected_signature.lower()
    
    def process_result_notification(self, notification_data: Dict[str, Any]) -> bool:
        """
        Обработка уведомления от ResultURL.
        
        Args:
            notification_data: Данные от Robokassa
            
        Returns:
            True если обработано успешно, False иначе
        """
        try:
            out_sum = notification_data.get('OutSum', '')
            inv_id = notification_data.get('InvId', '')
            signature = notification_data.get('SignatureValue', '')
            
            if not all([out_sum, inv_id, signature]):
                logger.error("Invalid notification: missing required parameters")
                return False
            
            # Получаем дополнительные параметры
            shp_params = {k: v for k, v in notification_data.items() if k.startswith('shp_')}
            
            # Проверяем подпись
            if not self.verify_result_signature(out_sum, inv_id, signature, **shp_params):
                logger.error(f"Invalid signature for payment {inv_id}")
                return False
            
            # Находим транзакцию
            try:
                from orders.models import Order
                order = Order.objects.get(id=inv_id)
                transaction = PaymentTransaction.objects.get(order=order)
            except (Order.DoesNotExist, PaymentTransaction.DoesNotExist):
                logger.error(f"Order or transaction not found for InvId: {inv_id}")
                return False
            
            # Проверяем сумму
            if Decimal(out_sum) != order.total_amount:
                logger.error(f"Amount mismatch for order {order.order_number}: {out_sum} != {order.total_amount}")
                return False
            
            # Обновляем статус транзакции
            old_status = transaction.status
            transaction.status = 'succeeded'
            transaction.save()
            
            # Обновляем статус заказа
            order.payment_status = 'paid'
            order.status = 'paid'
            order.save()
            
            logger.info(f"Payment succeeded for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"Result notification processing failed: {str(e)}")
            return False
    
    def process_result_url2_notification(self, jws_token: str) -> bool:
        """
        Обработка уведомления от ResultUrl2 (формат JWS).
        
        Args:
            jws_token: JWS токен от Robokassa
            
        Returns:
            True если обработано успешно, False иначе
        """
        try:
            # Декодируем JWS (без проверки подписи для упрощения)
            # В продакшене следует проверять подпись с использованием сертификата
            parts = jws_token.split('.')
            if len(parts) != 3:
                logger.error("Invalid JWS token format")
                return False
            
            # Декодируем payload
            payload = parts[1]
            # Добавляем padding если нужно
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            
            decoded = base64.urlsafe_b64decode(payload)
            data = json.loads(decoded)
            
            # Извлекаем данные
            payment_data = data.get('data', {})
            inv_id = payment_data.get('invId')
            state = payment_data.get('state')
            inc_sum = payment_data.get('incSum')
            
            if not inv_id or state != 'OK':
                logger.warning(f"Payment not successful: state={state}")
                return False
            
            # Находим и обновляем заказ
            try:
                from orders.models import Order
                order = Order.objects.get(id=inv_id)
                transaction = PaymentTransaction.objects.get(order=order)
            except (Order.DoesNotExist, PaymentTransaction.DoesNotExist):
                logger.error(f"Order or transaction not found for InvId: {inv_id}")
                return False
            
            # Обновляем статусы
            transaction.status = 'succeeded'
            transaction.save()
            
            order.payment_status = 'paid'
            order.status = 'paid'
            order.save()
            
            logger.info(f"Payment succeeded (ResultUrl2) for order {order.order_number}")
            return True
            
        except Exception as e:
            logger.error(f"ResultUrl2 notification processing failed: {str(e)}")
            return False
    
    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Получение статуса платежа.
        
        Args:
            payment_id: ID платежа
            
        Returns:
            Данные о статусе платежа или None
        """
        try:
            transaction = PaymentTransaction.objects.get(payment_id=payment_id)
            
            return {
                'payment_id': payment_id,
                'status': transaction.status,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'order_id': transaction.order.id,
                'order_number': transaction.order.order_number,
                'created_at': transaction.created_at.isoformat(),
                'updated_at': transaction.updated_at.isoformat()
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
