#!/usr/bin/env python
"""
Скрипт для создания категорий продуктов.
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from products.models import Category

def create_product_categories():
    """Создает категории продуктов."""
    
    categories_data = [
        {
            'name': 'Витамины и минералы',
            'description': 'Высококачественные витаминные комплексы и минеральные добавки для поддержания здоровья',
            'slug': 'vitamins-minerals'
        },
        {
            'name': 'Спортивное питание',
            'description': 'Протеины, аминокислоты и добавки для спортсменов и активных людей',
            'slug': 'sports-nutrition'
        },
        {
            'name': 'Здоровое питание',
            'description': 'Органические продукты, суперфуды и натуральные добавки для здорового образа жизни',
            'slug': 'healthy-food'
        },
        {
            'name': 'Красота и уход',
            'description': 'Натуральная косметика и средства для ухода за кожей и волосами',
            'slug': 'beauty-care'
        },
        {
            'name': 'Травяные чаи',
            'description': 'Лечебные и оздоровительные травяные сборы и чаи',
            'slug': 'herbal-teas'
        },
        {
            'name': 'Детское питание',
            'description': 'Безопасные и полезные продукты для детей всех возрастов',
            'slug': 'baby-food'
        }
    ]
    
    created_count = 0
    
    for category_data in categories_data:
        category, created = Category.objects.get_or_create(
            slug=category_data['slug'],
            defaults={
                'name': category_data['name'],
                'description': category_data['description']
            }
        )
        
        if created:
            print(f"✅ Создана категория: {category.name}")
            created_count += 1
        else:
            print(f"⚠️  Категория уже существует: {category.name}")
    
    print(f"\n📊 Статистика:")
    print(f"Создано новых категорий: {created_count}")
    print(f"Всего категорий в базе: {Category.objects.count()}")

if __name__ == '__main__':
    create_product_categories()