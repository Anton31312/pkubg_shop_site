"""
Простой тест API заказов
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Войти как администратор
print("1. Вход в систему...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={
        "email": "admin@example.com",
        "password": "admin123"
    }
)

if login_response.status_code == 200:
    data = login_response.json()
    token = data.get('access')
    print(f"✓ Успешный вход. Токен получен.")
    print(f"  Пользователь: {data.get('user', {}).get('email')}")
    print(f"  Роль: {data.get('user', {}).get('role')}")
else:
    print(f"✗ Ошибка входа: {login_response.status_code}")
    print(f"  {login_response.text}")
    exit(1)

# 2. Получить все заказы
print("\n2. Получение всех заказов...")
headers = {"Authorization": f"Bearer {token}"}
orders_response = requests.get(
    f"{BASE_URL}/api/orders/admin/all/",
    headers=headers
)

print(f"  URL: {BASE_URL}/api/orders/admin/all/")
print(f"  Status: {orders_response.status_code}")

if orders_response.status_code == 200:
    orders_data = orders_response.json()
    print(f"✓ Заказы получены")
    print(f"  Всего заказов: {orders_data.get('total', 0)}")
    print(f"  На странице: {len(orders_data.get('orders', []))}")
    
    if orders_data.get('orders'):
        print(f"\n  Первый заказ:")
        first_order = orders_data['orders'][0]
        print(f"    Номер: {first_order.get('order_number')}")
        print(f"    Покупатель: {first_order.get('user_name')}")
        print(f"    Статус: {first_order.get('status_display')}")
        print(f"    Сумма: {first_order.get('total_amount')} ₽")
else:
    print(f"✗ Ошибка получения заказов: {orders_response.status_code}")
    print(f"  {orders_response.text}")

# 3. Проверить с параметрами
print("\n3. Получение заказов с параметрами...")
orders_response2 = requests.get(
    f"{BASE_URL}/api/orders/admin/all/",
    headers=headers,
    params={"page": 1, "page_size": 10}
)

print(f"  Status: {orders_response2.status_code}")
if orders_response2.status_code == 200:
    print(f"✓ Заказы с параметрами получены")
else:
    print(f"✗ Ошибка: {orders_response2.text}")

print("\n✓ Тест завершен")
