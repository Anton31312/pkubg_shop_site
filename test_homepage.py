#!/usr/bin/env python
"""
Тест главной страницы.
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_homepage_data():
    """Тестирует данные, необходимые для главной страницы."""
    
    print("🏠 Тестирование данных для главной страницы...")
    
    # Тест 1: Получение категорий продуктов
    print("\n1. Тестирование получения категорий продуктов...")
    try:
        response = requests.get(f'{BASE_URL}/products/categories/')
        response.raise_for_status()
        data = response.json()
        
        categories_count = data.get('count', len(data) if isinstance(data, list) else 0)
        print(f"   ✅ Получено категорий: {categories_count}")
        
        if data.get('results'):
            first_category = data['results'][0]
            print(f"   ✅ Первая категория: {first_category['name']}")
            print(f"   ✅ Описание: {first_category.get('description', 'Нет описания')}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return
    
    # Тест 2: Получение последних статей
    print("\n2. Тестирование получения последних статей...")
    try:
        response = requests.get(f'{BASE_URL}/articles/api/articles/', params={'page_size': 3})
        response.raise_for_status()
        data = response.json()
        
        articles_count = data.get('count', len(data) if isinstance(data, list) else 0)
        print(f"   ✅ Получено статей: {articles_count}")
        
        if data.get('results'):
            for i, article in enumerate(data['results'][:3], 1):
                print(f"   ✅ Статья {i}: {article['title']}")
                print(f"      Автор: {article['author_name']}")
                print(f"      Категория: {article.get('category_name', 'Без категории')}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 3: Проверка доступности главной страницы фронтенда
    print("\n3. Тестирование доступности фронтенда...")
    try:
        response = requests.get('http://localhost:3000/', timeout=5)
        if response.status_code == 200:
            print("   ✅ Фронтенд доступен")
        else:
            print(f"   ⚠️  Фронтенд вернул статус: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Фронтенд недоступен (возможно, не запущен)")
    except Exception as e:
        print(f"   ❌ Ошибка при проверке фронтенда: {e}")
    
    print("\n🎉 Тестирование завершено!")
    print("\n📋 Для проверки главной страницы откройте: http://localhost:3000/")

if __name__ == '__main__':
    test_homepage_data()