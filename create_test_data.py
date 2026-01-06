#!/usr/bin/env python
"""
Скрипт для создания тестовых данных для проверки функционала управления товарами
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from accounts.models import User
from products.models import Category, Product

def create_test_data():
    print("Создание тестовых данных...")
    
    # Создание тестового администратора
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@pkubg.com',
            'first_name': 'Администратор',
            'last_name': 'Системы',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✓ Создан администратор: {admin_user.email} (пароль: admin123)")
    else:
        print(f"✓ Администратор уже существует: {admin_user.email}")
    
    # Создание тестового менеджера
    manager_user, created = User.objects.get_or_create(
        username='manager',
        defaults={
            'email': 'manager@pkubg.com',
            'first_name': 'Менеджер',
            'last_name': 'Товаров',
            'role': 'manager'
        }
    )
    if created:
        manager_user.set_password('manager123')
        manager_user.save()
        print(f"✓ Создан менеджер: {manager_user.email} (пароль: manager123)")
    else:
        print(f"✓ Менеджер уже существует: {manager_user.email}")
    
    # Создание тестовых категорий
    categories_data = [
        {
            'name': 'Безглютеновые продукты',
            'slug': 'gluten-free',
            'description': 'Продукты без глютена для людей с целиакией'
        },
        {
            'name': 'Низкобелковые продукты',
            'slug': 'low-protein',
            'description': 'Продукты с пониженным содержанием белка'
        },
        {
            'name': 'Хлебобулочные изделия',
            'slug': 'bakery',
            'description': 'Специальные хлебобулочные изделия'
        },
        {
            'name': 'Макаронные изделия',
            'slug': 'pasta',
            'description': 'Специальные макаронные изделия'
        },
        {
            'name': 'Крупы и каши',
            'slug': 'cereals',
            'description': 'Специальные крупы и готовые каши'
        }
    ]
    
    created_categories = []
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )
        created_categories.append(category)
        if created:
            print(f"✓ Создана категория: {category.name}")
        else:
            print(f"✓ Категория уже существует: {category.name}")
    
    # Создание тестовых товаров
    products_data = [
        {
            'name': 'Безглютеновый хлеб "Здоровье"',
            'slug': 'gluten-free-bread-health',
            'description': 'Специальный хлеб без глютена, изготовленный из рисовой и кукурузной муки. Подходит для людей с целиакией.',
            'price': 250.00,
            'category': created_categories[0],  # Безглютеновые продукты
            'is_gluten_free': True,
            'is_low_protein': False,
            'stock_quantity': 50,
            'nutritional_info': {
                'per_100g': {
                    'calories': 220,
                    'proteins': 3.5,
                    'fats': 2.1,
                    'carbohydrates': 45.2,
                    'fiber': 2.8,
                    'sugar': 1.2,
                    'salt': 1.1,
                    'sodium': 440
                },
                'allergens': ['кукуруза'],
                'dietary_info': {
                    'is_vegetarian': True,
                    'is_vegan': True,
                    'is_gluten_free': True,
                    'is_lactose_free': True,
                    'is_sugar_free': False,
                    'is_organic': False
                }
            }
        },
        {
            'name': 'Низкобелковые макароны "Диета+"',
            'slug': 'low-protein-pasta-diet',
            'description': 'Специальные макароны с пониженным содержанием белка для людей с заболеваниями почек.',
            'price': 180.00,
            'category': created_categories[1],  # Низкобелковые продукты
            'is_gluten_free': False,
            'is_low_protein': True,
            'stock_quantity': 30,
            'nutritional_info': {
                'per_100g': {
                    'calories': 350,
                    'proteins': 1.2,
                    'fats': 0.8,
                    'carbohydrates': 85.5,
                    'fiber': 1.5,
                    'sugar': 0.5,
                    'salt': 0.02,
                    'sodium': 8
                },
                'allergens': ['глютен'],
                'dietary_info': {
                    'is_vegetarian': True,
                    'is_vegan': True,
                    'is_gluten_free': False,
                    'is_lactose_free': True,
                    'is_sugar_free': True,
                    'is_organic': False
                }
            }
        },
        {
            'name': 'Рисовая каша быстрого приготовления',
            'slug': 'instant-rice-porridge',
            'description': 'Готовая рисовая каша без добавок, подходит для диетического питания.',
            'price': 120.00,
            'category': created_categories[4],  # Крупы и каши
            'is_gluten_free': True,
            'is_low_protein': True,
            'stock_quantity': 100,
            'nutritional_info': {
                'per_100g': {
                    'calories': 130,
                    'proteins': 2.7,
                    'fats': 0.3,
                    'carbohydrates': 28.0,
                    'fiber': 0.4,
                    'sugar': 0.1,
                    'salt': 0.01,
                    'sodium': 4
                },
                'allergens': [],
                'dietary_info': {
                    'is_vegetarian': True,
                    'is_vegan': True,
                    'is_gluten_free': True,
                    'is_lactose_free': True,
                    'is_sugar_free': True,
                    'is_organic': True
                }
            }
        },
        {
            'name': 'Безглютеновое печенье "Овсяное"',
            'slug': 'gluten-free-oat-cookies',
            'description': 'Вкусное печенье из овсяной муки без глютена. Идеально для чаепития.',
            'price': 320.00,
            'category': created_categories[2],  # Хлебобулочные изделия
            'is_gluten_free': True,
            'is_low_protein': False,
            'stock_quantity': 25,
            'nutritional_info': {
                'per_100g': {
                    'calories': 450,
                    'proteins': 8.2,
                    'fats': 18.5,
                    'carbohydrates': 62.3,
                    'fiber': 6.1,
                    'sugar': 15.2,
                    'salt': 0.8,
                    'sodium': 320
                },
                'allergens': ['овес'],
                'dietary_info': {
                    'is_vegetarian': True,
                    'is_vegan': False,
                    'is_gluten_free': True,
                    'is_lactose_free': False,
                    'is_sugar_free': False,
                    'is_organic': False
                }
            }
        },
        {
            'name': 'Специальные спагетти без белка',
            'slug': 'protein-free-spaghetti',
            'description': 'Уникальные спагетти практически без белка для строгой диеты.',
            'price': 280.00,
            'category': created_categories[3],  # Макаронные изделия
            'is_gluten_free': False,
            'is_low_protein': True,
            'stock_quantity': 15,
            'nutritional_info': {
                'per_100g': {
                    'calories': 360,
                    'proteins': 0.5,
                    'fats': 1.2,
                    'carbohydrates': 88.0,
                    'fiber': 2.1,
                    'sugar': 0.8,
                    'salt': 0.05,
                    'sodium': 20
                },
                'allergens': ['глютен'],
                'dietary_info': {
                    'is_vegetarian': True,
                    'is_vegan': True,
                    'is_gluten_free': False,
                    'is_lactose_free': True,
                    'is_sugar_free': True,
                    'is_organic': False
                }
            }
        }
    ]
    
    for prod_data in products_data:
        product, created = Product.objects.get_or_create(
            slug=prod_data['slug'],
            defaults=prod_data
        )
        if created:
            print(f"✓ Создан товар: {product.name} - {product.price}₽")
        else:
            print(f"✓ Товар уже существует: {product.name}")
    
    print("\n" + "="*50)
    print("Тестовые данные созданы успешно!")
    print("="*50)
    print("\nДля входа используйте:")
    print("Администратор: admin@pkubg.com / admin123")
    print("Менеджер: manager@pkubg.com / manager123")
    print("\nПерейдите по адресу: http://localhost:8000/products/manage")
    print("="*50)

if __name__ == '__main__':
    create_test_data()