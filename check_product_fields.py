#!/usr/bin/env python
"""
Проверка новых полей продукта через Django ORM.
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from products.models import Product

def check_product_fields():
    """Проверяет новые поля продукта через ORM."""
    
    print("🛍️ Проверка новых полей продукта через Django ORM...")
    
    # Получаем все продукты
    products = Product.objects.all()
    total_count = products.count()
    
    print(f"\n📊 Общая статистика:")
    print(f"   Всего продуктов: {total_count}")
    
    # Проверяем заполненность новых полей
    with_manufacturer = products.exclude(manufacturer='').count()
    with_composition = products.exclude(composition='').count()
    with_storage = products.exclude(storage_conditions='').count()
    
    print(f"\n📋 Заполненность новых полей:")
    print(f"   Производитель: {with_manufacturer}/{total_count} ({with_manufacturer/total_count*100:.1f}%)")
    print(f"   Состав: {with_composition}/{total_count} ({with_composition/total_count*100:.1f}%)")
    print(f"   Условия хранения: {with_storage}/{total_count} ({with_storage/total_count*100:.1f}%)")
    
    # Показываем примеры продуктов с новыми полями
    print(f"\n📝 Примеры продуктов с новыми полями:")
    
    products_with_fields = products.exclude(manufacturer='')[:3]
    
    for i, product in enumerate(products_with_fields, 1):
        print(f"\n   {i}. {product.name}")
        print(f"      ID: {product.id}")
        print(f"      Цена: {product.price} ₽")
        print(f"      Производитель: {product.manufacturer or 'Не указан'}")
        print(f"      Состав: {(product.composition[:100] + '...') if product.composition else 'Не указан'}")
        print(f"      Условия хранения: {(product.storage_conditions[:80] + '...') if product.storage_conditions else 'Не указаны'}")
    
    # Проверяем структуру полей
    print(f"\n🔍 Проверка структуры полей:")
    
    if products.exists():
        first_product = products.first()
        
        # Проверяем, что поля существуют
        try:
            manufacturer = first_product.manufacturer
            composition = first_product.composition
            storage_conditions = first_product.storage_conditions
            
            print(f"   ✅ Поле 'manufacturer' доступно")
            print(f"   ✅ Поле 'composition' доступно")
            print(f"   ✅ Поле 'storage_conditions' доступно")
            
        except AttributeError as e:
            print(f"   ❌ Ошибка доступа к полю: {e}")
    
    # Проверяем миграции
    print(f"\n🔄 Проверка миграций:")
    from django.db import connection
    
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(products_product);")
        columns = cursor.fetchall()
        
        new_fields = ['manufacturer', 'composition', 'storage_conditions']
        existing_fields = [col[1] for col in columns]
        
        for field in new_fields:
            if field in existing_fields:
                print(f"   ✅ Поле '{field}' существует в БД")
            else:
                print(f"   ❌ Поле '{field}' отсутствует в БД")
    
    print(f"\n🎉 Проверка завершена!")
    
    # Рекомендации
    if with_manufacturer < total_count:
        print(f"\n💡 Рекомендации:")
        print(f"   • Заполните поле 'Производитель' для {total_count - with_manufacturer} продуктов")
        print(f"   • Используйте админку Django: http://127.0.0.1:8000/admin/products/product/")
    
    return {
        'total_products': total_count,
        'with_manufacturer': with_manufacturer,
        'with_composition': with_composition,
        'with_storage': with_storage
    }

if __name__ == '__main__':
    check_product_fields()