#!/usr/bin/env python
"""
Тест API статей.
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api/articles/api'

def test_articles_api():
    """Тестирует основные функции API статей."""
    
    print("🧪 Тестирование API статей...")
    
    # Тест 1: Получение списка статей
    print("\n1. Тестирование получения списка статей...")
    try:
        response = requests.get(f'{BASE_URL}/articles/')
        response.raise_for_status()
        data = response.json()
        
        print(f"   ✅ Получено статей: {data['count']}")
        print(f"   ✅ Первая статья: {data['results'][0]['title']}")
        
        # Сохраняем slug первой статьи для следующего теста
        first_article_slug = data['results'][0]['slug']
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return
    
    # Тест 2: Получение конкретной статьи по slug
    print(f"\n2. Тестирование получения статьи по slug: {first_article_slug}")
    try:
        response = requests.get(f'{BASE_URL}/articles/{first_article_slug}/')
        response.raise_for_status()
        article = response.json()
        
        print(f"   ✅ Заголовок: {article['title']}")
        print(f"   ✅ Автор: {article['author_name']}")
        print(f"   ✅ Опубликована: {'Да' if article['is_published'] else 'Нет'}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 3: Получение категорий
    print("\n3. Тестирование получения категорий...")
    try:
        response = requests.get(f'{BASE_URL}/categories/')
        response.raise_for_status()
        categories = response.json()
        
        if isinstance(categories, list):
            print(f"   ✅ Получено категорий: {len(categories)}")
            if categories:
                print(f"   ✅ Первая категория: {categories[0]['name']}")
        else:
            print(f"   ✅ Получено категорий: {categories.get('count', 0)}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 4: Получение тегов
    print("\n4. Тестирование получения тегов...")
    try:
        response = requests.get(f'{BASE_URL}/tags/')
        response.raise_for_status()
        tags = response.json()
        
        if isinstance(tags, list):
            print(f"   ✅ Получено тегов: {len(tags)}")
            if tags:
                print(f"   ✅ Первый тег: {tags[0]['name']}")
        else:
            print(f"   ✅ Получено тегов: {tags.get('count', 0)}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 5: Поиск статей
    print("\n5. Тестирование поиска статей...")
    try:
        response = requests.get(f'{BASE_URL}/articles/', params={'search': 'здоровье'})
        response.raise_for_status()
        data = response.json()
        
        print(f"   ✅ Найдено статей по запросу 'здоровье': {data['count']}")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    # Тест 6: Фильтрация по категории
    print("\n6. Тестирование фильтрации по категории...")
    try:
        # Сначала получаем ID первой категории
        response = requests.get(f'{BASE_URL}/categories/')
        categories = response.json()
        
        if categories and len(categories) > 0:
            category_id = categories[0]['id']
            
            response = requests.get(f'{BASE_URL}/articles/', params={'category': category_id})
            response.raise_for_status()
            data = response.json()
            
            print(f"   ✅ Найдено статей в категории '{categories[0]['name']}': {data['count']}")
        else:
            print("   ⚠️  Категории не найдены")
        
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
    
    print("\n🎉 Тестирование завершено!")

if __name__ == '__main__':
    test_articles_api()