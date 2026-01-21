"""
Тестовый скрипт для проверки API управления заказами администраторами.
"""
import requests
import json

# Настройки
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Данные для входа (замените на реальные)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


def login(email, password):
    """Вход в систему и получение токена."""
    response = requests.post(
        f"{API_URL}/accounts/login/",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Успешный вход: {data.get('user', {}).get('email')}")
        print(f"  Роль: {data.get('user', {}).get('role')}")
        return data.get('access')
    else:
        print(f"✗ Ошибка входа: {response.status_code}")
        print(f"  {response.text}")
        return None


def get_all_orders(token, status=None, payment_status=None, search=None, page=1):
    """Получить все заказы."""
    headers = {"Authorization": f"Bearer {token}"}
    params = {"page": page, "page_size": 10}
    
    if status:
        params["status"] = status
    if payment_status:
        params["payment_status"] = payment_status
    if search:
        params["search"] = search
    
    response = requests.get(
        f"{API_URL}/orders/admin/all/",
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Получено заказов: {len(data['orders'])} из {data['total']}")
        print(f"  Страница: {data['page']} из {data['total_pages']}")
        
        for order in data['orders']:
            print(f"\n  Заказ #{order['order_number']}")
            print(f"    Покупатель: {order['user_name']} ({order['user_email']})")
            print(f"    Статус: {order['status_display']}")
            print(f"    Оплата: {order['payment_status_display']}")
            print(f"    Сумма: {order['total_amount']} ₽")
            print(f"    Товаров: {order['items_count']}")
            print(f"    Дата: {order['created_at']}")
        
        return data
    else:
        print(f"\n✗ Ошибка получения заказов: {response.status_code}")
        print(f"  {response.text}")
        return None


def get_order_detail(token, order_id):
    """Получить детали заказа."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/orders/admin/{order_id}/",
        headers=headers
    )
    
    if response.status_code == 200:
        order = response.json()
        print(f"\n✓ Детали заказа #{order['order_number']}")
        print(f"  Покупатель: {order['user_name']}")
        print(f"  Email: {order['user_email']}")
        print(f"  Телефон: {order['user_phone']}")
        print(f"  Статус: {order['status_display']}")
        print(f"  Оплата: {order['payment_status_display']}")
        print(f"  Сумма: {order['total_amount']} ₽")
        print(f"  Адрес: {order['shipping_address']}")
        print(f"  Доставка: {order['delivery_method']}")
        print(f"  Трек-номер: {order['delivery_tracking'] or 'Не указан'}")
        print(f"  Комментарий: {order['notes'] or 'Нет'}")
        
        print(f"\n  Товары:")
        for item in order['items']:
            print(f"    - {item['product']['name']}")
            print(f"      Количество: {item['quantity']}")
            print(f"      Цена: {item['price']} ₽")
            print(f"      Подытог: {item['subtotal']} ₽")
        
        return order
    else:
        print(f"\n✗ Ошибка получения деталей: {response.status_code}")
        print(f"  {response.text}")
        return None


def update_order_status(token, order_id, status=None, payment_status=None, tracking=None):
    """Обновить статус заказа."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {}
    if status:
        data["status"] = status
    if payment_status:
        data["payment_status"] = payment_status
    if tracking:
        data["delivery_tracking"] = tracking
    
    response = requests.patch(
        f"{API_URL}/orders/admin/{order_id}/update/",
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ {result['message']}")
        order = result['order']
        print(f"  Заказ: {order['order_number']}")
        print(f"  Новый статус: {order['status_display']}")
        print(f"  Статус оплаты: {order['payment_status_display']}")
        return result
    else:
        print(f"\n✗ Ошибка обновления: {response.status_code}")
        print(f"  {response.text}")
        return None


def get_statistics(token):
    """Получить статистику заказов."""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/orders/admin/statistics/",
        headers=headers
    )
    
    if response.status_code == 200:
        stats = response.json()
        print(f"\n✓ Статистика заказов:")
        print(f"  Всего заказов: {stats['total_orders']}")
        print(f"  Общая выручка: {stats['total_revenue']} ₽")
        
        print(f"\n  По статусам:")
        for item in stats['orders_by_status']:
            print(f"    {item['status']}: {item['count']}")
        
        print(f"\n  По статусам оплаты:")
        for item in stats['orders_by_payment_status']:
            print(f"    {item['payment_status']}: {item['count']}")
        
        print(f"\n  Последние заказы: {len(stats['recent_orders'])}")
        
        return stats
    else:
        print(f"\n✗ Ошибка получения статистики: {response.status_code}")
        print(f"  {response.text}")
        return None


def main():
    """Основная функция для тестирования API."""
    print("=" * 60)
    print("Тестирование API управления заказами")
    print("=" * 60)
    
    # Вход в систему
    token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not token:
        print("\n⚠ Не удалось войти в систему. Проверьте данные для входа.")
        return
    
    # Получить статистику
    print("\n" + "=" * 60)
    print("1. Получение статистики")
    print("=" * 60)
    get_statistics(token)
    
    # Получить все заказы
    print("\n" + "=" * 60)
    print("2. Получение всех заказов")
    print("=" * 60)
    orders_data = get_all_orders(token)
    
    if orders_data and orders_data['orders']:
        # Получить детали первого заказа
        first_order_id = orders_data['orders'][0]['id']
        
        print("\n" + "=" * 60)
        print("3. Получение деталей заказа")
        print("=" * 60)
        get_order_detail(token, first_order_id)
        
        # Обновить статус (раскомментируйте для тестирования)
        # print("\n" + "=" * 60)
        # print("4. Обновление статуса заказа")
        # print("=" * 60)
        # update_order_status(token, first_order_id, status="processing")
    
    # Фильтрация по статусу
    print("\n" + "=" * 60)
    print("5. Фильтрация по статусу 'pending'")
    print("=" * 60)
    get_all_orders(token, status="pending")
    
    print("\n" + "=" * 60)
    print("Тестирование завершено")
    print("=" * 60)


if __name__ == "__main__":
    main()
