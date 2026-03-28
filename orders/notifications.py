import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_vk_message(user_id, message):
    """Отправить сообщение через ВК API."""
    if not settings.VK_GROUP_TOKEN:
        logger.warning('VK_GROUP_TOKEN не настроен')
        return False

    try:
        response = requests.post(
            'https://api.vk.com/method/messages.send',
            data={
                'user_id': user_id,
                'message': message,
                'random_id': 0,
                'access_token': settings.VK_GROUP_TOKEN,
                'v': '5.131',
            },
            timeout=10,
        )

        result = response.json()

        if 'error' in result:
            logger.error(f'VK API error: {result["error"]}')
            return False

        return True

    except Exception as e:
        logger.error(f'VK notification error: {e}')
        return False


def notify_new_order(order):
    """Уведомить админов о новом заказе."""
    message = (
        f'🛒 Новый заказ #{order.order_number}\n\n'
        f'👤 Покупатель: {order.user.first_name} {order.user.last_name}\n'
        f'📧 Email: {order.user.email}\n'
        f'📱 Телефон: {getattr(order.user, "phone", "не указан")}\n\n'
        f'📦 Товары:\n'
    )

    for item in order.items.select_related('product'):
        message += f'  • {item.product.name} × {item.quantity} — {item.price}₽\n'

    message += (
        f'\n💰 Сумма: {order.total_amount}₽\n'
        f'📍 Адрес: {order.shipping_address}\n'
    )

    if order.notes:
        message += f'💬 Комментарий: {order.notes}\n'

    message += f'\n🔗 Управление: https://pkubg.ru/orders/manage'

    # Отправляем каждому админу
    for admin_id in settings.VK_ADMIN_IDS:
        send_vk_message(admin_id, message)


def notify_order_status_changed(order, old_status):
    """Уведомить покупателя об изменении статуса (опционально)."""
    status_names = dict(order.ORDER_STATUS_CHOICES)
    message = (
        f'📋 Статус заказа #{order.order_number} изменён\n\n'
        f'{status_names.get(old_status, old_status)} → {status_names.get(order.status, order.status)}\n'
    )

    if order.delivery_tracking:
        message += f'\n📦 Трек-номер: {order.delivery_tracking}'

    # Здесь можно отправить покупателю если он подключил ВК
    logger.info(f'Order {order.order_number} status changed: {old_status} → {order.status}')