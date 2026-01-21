#!/usr/bin/env python
"""
Скрипт для тестирования API оформления заказа
"""
import os
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from django.contrib.auth import get_user_model
from orders.models import Order, Cart, CartItem
from products.models import Product
from integrations.models import PaymentTransaction
from integrations.robokassa_service import RobokassaService

User = get_user_model()

def test_checkout_flow():
    """Тестирование полного процесса оформления заказа"""
    
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ ПРОЦЕССА ОФОРМЛЕНИЯ ЗАКАЗА")
    print("=" * 60)
    
    # 1. Создаем или получаем тестового пользователя
    print("\n1. Создание тестового пользователя...")
    user, created = User.objects.get_or_create(
        email='test_checkout@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'customer'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"   ✅ Создан пользователь: {user.email}")
    else:
        print(f"   ✅ Используется существующий пользователь: {user.email}")
    
    # 2. Создаем или получаем корзину
    print("\n2. Создание корзины...")
    cart, created = Cart.objects.get_or_create(user=user)
    print(f"   ✅ Корзина {'создана' if created else 'получена'}")
    
    # 3. Добавляем товары в корзину
    print("\n3. Добавление товаров в корзину...")
    products = Product.objects.filter(is_active=True)[:2]
    
    if not products:
        print("   ⚠️  Нет активных товаров. Создайте товары командой: python create_test_products.py")
        return
    
    cart.items.all().delete()  # Очищаем корзину
    
    for product in products:
        cart_item = cart.add_item(product, quantity=2)
        print(f"   ✅ Добавлен товар: {product.name} x 2 = {product.price * 2} ₽")
    
    print(f"\n   📊 Итого в корзине: {cart.total_items} товаров на сумму {cart.total_amount} ₽")
    
    # 4. Создаем заказ
    print("\n4. Создание заказа...")
    import uuid
    
    order = Order.objects.create(
        user=user,
        order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
        total_amount=cart.total_amount,
        shipping_address='г. Москва, ул. Ленина, д. 10, кв. 5',
        delivery_method='courier',
        notes='Позвонить за час до доставки',
        status='pending',
        payment_status='pending'
    )
    
    print(f"   ✅ Заказ создан: {order.order_number}")
    print(f"   📍 Адрес: {order.shipping_address}")
    print(f"   💬 Комментарий: {order.notes}")
    print(f"   💰 Сумма: {order.total_amount} ₽")
    
    # 5. Создаем элементы заказа
    print("\n5. Создание элементов заказа...")
    from orders.models import OrderItem
    
    for cart_item in cart.items.all():
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.price
        )
        print(f"   ✅ {cart_item.product.name} x {cart_item.quantity}")
    
    # 6. Создаем платеж через RoboKassa
    print("\n6. Создание платежа через RoboKassa...")
    robokassa = RobokassaService()
    
    try:
        payment_data = robokassa.create_payment_url(
            order=order,
            result_url='http://127.0.0.1:8000/api/integrations/webhooks/robokassa/',
            success_url='http://localhost:3000/payment-result?payment=success',
            fail_url='http://localhost:3000/payment-result?payment=failed'
        )
        
        print(f"   ✅ Платеж создан: {payment_data['payment_id']}")
        print(f"   💳 Сумма: {payment_data['amount']} {payment_data['currency']}")
        print(f"\n   🔗 URL для оплаты:")
        print(f"   {payment_data['payment_url'][:100]}...")
        
    except Exception as e:
        print(f"   ❌ Ошибка создания платежа: {e}")
        return
    
    # 7. Проверяем транзакцию
    print("\n7. Проверка транзакции...")
    transaction = PaymentTransaction.objects.filter(order=order).first()
    
    if transaction:
        print(f"   ✅ Транзакция создана: {transaction.payment_id}")
        print(f"   📊 Статус: {transaction.status}")
        print(f"   💰 Сумма: {transaction.amount} {transaction.currency}")
        print(f"   🏦 Система: {transaction.payment_system}")
    else:
        print(f"   ❌ Транзакция не найдена")
    
    # 8. Очищаем корзину (как в реальном процессе)
    print("\n8. Очистка корзины...")
    cart.items.all().delete()
    print(f"   ✅ Корзина очищена")
    
    # 9. Итоговая информация
    print("\n" + "=" * 60)
    print("РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    print(f"\n✅ Заказ успешно создан!")
    print(f"\n📋 Детали заказа:")
    print(f"   Номер заказа: {order.order_number}")
    print(f"   Пользователь: {user.email}")
    print(f"   Адрес: {order.shipping_address}")
    print(f"   Комментарий: {order.notes}")
    print(f"   Товаров: {order.items.count()}")
    print(f"   Сумма: {order.total_amount} ₽")
    print(f"   Статус заказа: {order.get_status_display()}")
    print(f"   Статус оплаты: {order.get_payment_status_display()}")
    
    if transaction:
        print(f"\n💳 Платеж:")
        print(f"   ID: {transaction.payment_id}")
        print(f"   Статус: {transaction.get_status_display()}")
        print(f"   Система: {transaction.get_payment_system_display()}")
    
    print("\n" + "=" * 60)
    print("СЛЕДУЮЩИЕ ШАГИ")
    print("=" * 60)
    print("\n1. Откройте URL для оплаты в браузере")
    print("2. Выберите способ оплаты на странице RoboKassa")
    print("3. В тестовом режиме используйте любые данные")
    print("4. После оплаты проверьте статус заказа:")
    print(f"\n   python manage.py shell")
    print(f"   >>> from orders.models import Order")
    print(f"   >>> order = Order.objects.get(order_number='{order.order_number}')")
    print(f"   >>> print(order.status, order.payment_status)")
    
    print("\n" + "=" * 60)
    
    return order


def check_configuration():
    """Проверка конфигурации RoboKassa"""
    
    print("\n" + "=" * 60)
    print("ПРОВЕРКА КОНФИГУРАЦИИ ROBOKASSA")
    print("=" * 60)
    
    from django.conf import settings
    
    config = {
        'ROBOKASSA_MERCHANT_LOGIN': getattr(settings, 'ROBOKASSA_MERCHANT_LOGIN', None),
        'ROBOKASSA_PASSWORD1': getattr(settings, 'ROBOKASSA_PASSWORD1', None),
        'ROBOKASSA_PASSWORD2': getattr(settings, 'ROBOKASSA_PASSWORD2', None),
        'ROBOKASSA_TEST_MODE': getattr(settings, 'ROBOKASSA_TEST_MODE', None),
    }
    
    all_ok = True
    
    for key, value in config.items():
        if value:
            if 'PASSWORD' in key:
                print(f"   ✅ {key}: {'*' * len(str(value))}")
            else:
                print(f"   ✅ {key}: {value}")
        else:
            print(f"   ❌ {key}: НЕ НАСТРОЕН")
            all_ok = False
    
    if all_ok:
        print("\n   ✅ Все настройки RoboKassa в порядке!")
    else:
        print("\n   ⚠️  Проверьте файл .env и добавьте недостающие настройки")
    
    print("=" * 60)
    
    return all_ok


def show_statistics():
    """Показать статистику заказов"""
    
    print("\n" + "=" * 60)
    print("СТАТИСТИКА ЗАКАЗОВ")
    print("=" * 60)
    
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(payment_status='pending').count()
    paid_orders = Order.objects.filter(payment_status='paid').count()
    
    print(f"\n   📊 Всего заказов: {total_orders}")
    print(f"   ⏳ Ожидают оплаты: {pending_orders}")
    print(f"   ✅ Оплачено: {paid_orders}")
    
    if total_orders > 0:
        print(f"\n   📋 Последние 5 заказов:")
        for order in Order.objects.order_by('-created_at')[:5]:
            print(f"      {order.order_number} - {order.get_payment_status_display()} - {order.total_amount} ₽")
    
    print("=" * 60)


if __name__ == '__main__':
    import sys
    
    # Проверяем конфигурацию
    if not check_configuration():
        print("\n⚠️  Настройте RoboKassa в файле .env перед тестированием")
        sys.exit(1)
    
    # Показываем статистику
    show_statistics()
    
    # Запускаем тест
    try:
        order = test_checkout_flow()
        print("\n✅ Тест завершен успешно!")
    except Exception as e:
        print(f"\n❌ Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
