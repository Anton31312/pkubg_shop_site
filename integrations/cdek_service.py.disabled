"""
CDEK delivery service integration.
"""
import logging
import requests
from decimal import Decimal
from typing import Dict, List, Optional
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from orders.models import Order
from .models import DeliveryRequest

logger = logging.getLogger(__name__)


class CDEKError(Exception):
    """CDEK service error."""
    pass


class CDEKService:
    """Service for CDEK delivery integration."""
    
    def __init__(self):
        """Initialize CDEK service."""
        self.base_url = getattr(settings, 'CDEK_API_URL', 'https://api.cdek.ru/v2')
        self.client_id = getattr(settings, 'CDEK_CLIENT_ID', None)
        self.client_secret = getattr(settings, 'CDEK_CLIENT_SECRET', None)
        
        if not self.client_id or not self.client_secret:
            raise ImproperlyConfigured("CDEK credentials not configured")
        
        self._access_token = None
    
    def _get_access_token(self) -> str:
        """Get access token for CDEK API."""
        if self._access_token:
            return self._access_token
        
        try:
            response = requests.post(
                f"{self.base_url}/oauth/token",
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret
                }
            )
            response.raise_for_status()
            
            token_data = response.json()
            self._access_token = token_data['access_token']
            return self._access_token
            
        except requests.RequestException as e:
            logger.error(f"Failed to get CDEK access token: {e}")
            raise CDEKError("Не удалось получить токен доступа CDEK")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make authenticated request to CDEK API."""
        token = self._get_access_token()
        headers = kwargs.get('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        kwargs['headers'] = headers
        
        try:
            response = requests.request(method, f"{self.base_url}{endpoint}", **kwargs)
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"CDEK API request failed: {e}")
            raise CDEKError(f"Ошибка API CDEK: {e}")
    
    def calculate_delivery_cost(self, from_location: str, to_location: str, 
                              weight: float, dimensions: Dict) -> Dict:
        """Calculate delivery cost."""
        try:
            payload = {
                'type': 1,  # Delivery to pickup point
                'from_location': {'address': from_location},
                'to_location': {'address': to_location},
                'packages': [{
                    'weight': int(weight * 1000),  # Convert to grams
                    'length': dimensions.get('length', 10),
                    'width': dimensions.get('width', 10),
                    'height': dimensions.get('height', 10)
                }]
            }
            
            response = self._make_request('POST', '/calculator/tariff', json=payload)
            
            if response.get('errors'):
                raise CDEKError(f"Ошибка расчета стоимости: {response['errors']}")
            
            return {
                'cost': Decimal(str(response.get('delivery_sum', 0))),
                'period_min': response.get('period_min', 1),
                'period_max': response.get('period_max', 3),
                'currency': 'RUB'
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate delivery cost: {e}")
            raise CDEKError("Не удалось рассчитать стоимость доставки")
    
    def find_pickup_points(self, address: str, limit: int = 10) -> List[Dict]:
        """Find pickup points near address."""
        try:
            params = {
                'city': address,
                'type': 'PVZ',  # Pickup points
                'size': limit
            }
            
            response = self._make_request('GET', '/deliverypoints', params=params)
            
            pickup_points = []
            for point in response:
                pickup_points.append({
                    'code': point.get('code'),
                    'name': point.get('name'),
                    'address': point.get('location', {}).get('address_full'),
                    'phone': point.get('phone'),
                    'work_time': point.get('work_time'),
                    'coordinates': {
                        'latitude': point.get('location', {}).get('latitude'),
                        'longitude': point.get('location', {}).get('longitude')
                    }
                })
            
            return pickup_points
            
        except Exception as e:
            logger.error(f"Failed to find pickup points: {e}")
            raise CDEKError("Не удалось найти пункты выдачи")
    
    def create_delivery_order(self, order: Order, pickup_point_code: str) -> Dict:
        """Create delivery order in CDEK."""
        try:
            # Generate unique order number for CDEK
            cdek_order_number = f"PKUBG-{order.order_number}"
            
            payload = {
                'number': cdek_order_number,
                'tariff_code': 136,  # Pickup point delivery
                'sender': {
                    'name': 'Pkubg Store',
                    'phones': [{'number': '+79001234567'}]
                },
                'recipient': {
                    'name': f"{order.user.first_name} {order.user.last_name}",
                    'phones': [{'number': getattr(order.user, 'phone', '+79001234567')}]
                },
                'from_location': {
                    'address': 'Москва, ул. Примерная, д. 1'  # Store address
                },
                'to_location': {
                    'code': pickup_point_code
                },
                'packages': [{
                    'number': '1',
                    'weight': 1000,  # Default 1kg
                    'length': 20,
                    'width': 20,
                    'height': 10,
                    'items': []
                }]
            }
            
            # Add order items
            for item in order.items.all():
                payload['packages'][0]['items'].append({
                    'name': item.product.name,
                    'ware_key': str(item.product.id),
                    'payment': {'value': float(item.price)},
                    'cost': float(item.price),
                    'weight': 100,  # Default 100g per item
                    'amount': item.quantity
                })
            
            response = self._make_request('POST', '/orders', json=payload)
            
            if response.get('errors'):
                raise CDEKError(f"Ошибка создания заказа: {response['errors']}")
            
            # Create delivery request record
            delivery_request = DeliveryRequest.objects.create(
                order=order,
                cdek_order_id=response['entity']['uuid'],
                pickup_point=pickup_point_code,
                status='created'
            )
            
            return {
                'cdek_order_id': response['entity']['uuid'],
                'order_number': cdek_order_number,
                'status': 'created'
            }
            
        except Exception as e:
            logger.error(f"Failed to create delivery order: {e}")
            raise CDEKError("Не удалось создать заказ доставки")
    
    def get_delivery_status(self, cdek_order_id: str) -> Dict:
        """Get delivery status from CDEK."""
        try:
            response = self._make_request('GET', f'/orders/{cdek_order_id}')
            
            status_mapping = {
                'CREATED': 'created',
                'ACCEPTED': 'accepted',
                'POSTOMAT_POSTED': 'in_transit',
                'DELIVERED': 'delivered',
                'NOT_DELIVERED': 'cancelled'
            }
            
            cdek_status = response.get('statuses', [{}])[-1].get('code', 'CREATED')
            mapped_status = status_mapping.get(cdek_status, 'created')
            
            return {
                'status': mapped_status,
                'cdek_status': cdek_status,
                'tracking_number': response.get('cdek_number'),
                'updated_at': response.get('statuses', [{}])[-1].get('date_time')
            }
            
        except Exception as e:
            logger.error(f"Failed to get delivery status: {e}")
            raise CDEKError("Не удалось получить статус доставки")
    
    def process_webhook(self, webhook_data: Dict) -> bool:
        """Process CDEK webhook notification."""
        try:
            order_uuid = webhook_data.get('uuid')
            status_code = webhook_data.get('code')
            
            if not order_uuid or not status_code:
                logger.warning("Invalid webhook data: missing uuid or status code")
                return False
            
            # Find delivery request
            try:
                delivery_request = DeliveryRequest.objects.get(cdek_order_id=order_uuid)
            except DeliveryRequest.DoesNotExist:
                logger.warning(f"Delivery request not found for uuid: {order_uuid}")
                return False
            
            # Update status
            status_mapping = {
                'CREATED': 'created',
                'ACCEPTED': 'accepted',
                'POSTOMAT_POSTED': 'in_transit',
                'DELIVERED': 'delivered',
                'NOT_DELIVERED': 'cancelled'
            }
            
            new_status = status_mapping.get(status_code, delivery_request.status)
            
            if new_status != delivery_request.status:
                delivery_request.status = new_status
                delivery_request.save()
                
                # Update order status if delivered
                if new_status == 'delivered':
                    order = delivery_request.order
                    order.status = 'delivered'
                    order.save()
                    
                    # Send notification to user (placeholder)
                    logger.info(f"Order {order.order_number} delivered")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process CDEK webhook: {e}")
            return False