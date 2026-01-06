#!/usr/bin/env python
"""
Скрипт для создания тестовой статьи.
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from django.contrib.auth import get_user_model
from articles.models import Article, ArticleCategory, ArticleTag

User = get_user_model()

def create_test_article():
    """Создает тестовую статью с информацией о клиническом исследовании."""
    
    # Создаем категорию если не существует
    category, created = ArticleCategory.objects.get_or_create(
        slug='clinical-research',
        defaults={
            'name': 'Клинические исследования'
        }
    )
    
    # Создаем теги
    tags_data = [
        ('oncology', 'Онкология'),
        ('clinical-trial', 'Клинические испытания'),
        ('research', 'Исследования'),
        ('medicine', 'Медицина')
    ]
    
    tags = []
    for slug, name in tags_data:
        tag, created = ArticleTag.objects.get_or_create(
            slug=slug,
            defaults={'name': name}
        )
        tags.append(tag)
    
    # Получаем или создаем администратора
    try:
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123',
                role='admin',
                first_name='Администратор',
                last_name='Системы'
            )
    except Exception as e:
        print(f"Ошибка при создании пользователя: {e}")
        return
    
    # Создаем статью
    article_data = {
        'title': 'Исследование эффективности комбинированной терапии при раке поджелудочной железы',
        'slug': 'pancreatic-cancer-combination-therapy-study',
        'content': '''
<h2>Описание исследования</h2>

<p>Данное клиническое исследование направлено на изучение эффективности и безопасности комбинированной терапии при лечении рака поджелудочной железы. Исследование проводится в рамках международной программы по разработке новых методов лечения онкологических заболеваний.</p>

<h3>Цели исследования</h3>

<ul>
<li><strong>Первичная цель:</strong> Оценить эффективность комбинированной терапии в сравнении со стандартным лечением</li>
<li><strong>Вторичные цели:</strong>
  <ul>
    <li>Оценить безопасность и переносимость лечения</li>
    <li>Изучить качество жизни пациентов</li>
    <li>Определить биомаркеры ответа на терапию</li>
  </ul>
</li>
</ul>

<h3>Критерии включения</h3>

<ul>
<li>Возраст от 18 до 75 лет</li>
<li>Гистологически подтвержденный диагноз рака поджелудочной железы</li>
<li>Стадия заболевания II-III</li>
<li>Удовлетворительное общее состояние (ECOG 0-1)</li>
<li>Адекватная функция органов</li>
</ul>

<h3>Критерии исключения</h3>

<ul>
<li>Предшествующая химиотерапия или лучевая терапия</li>
<li>Серьезные сопутствующие заболевания</li>
<li>Беременность или период лактации</li>
<li>Психические расстройства, препятствующие участию в исследовании</li>
</ul>

<h3>Дизайн исследования</h3>

<p>Рандомизированное контролируемое исследование III фазы с участием 300 пациентов. Пациенты будут рандомизированы в соотношении 1:1 в две группы:</p>

<ul>
<li><strong>Экспериментальная группа:</strong> Комбинированная терапия (новый препарат + стандартная химиотерапия)</li>
<li><strong>Контрольная группа:</strong> Стандартная химиотерапия</li>
</ul>

<h3>Ожидаемые результаты</h3>

<p>Ожидается, что комбинированная терапия покажет значительное улучшение показателей выживаемости без прогрессирования заболевания по сравнению со стандартным лечением. Также планируется получить данные о профиле безопасности нового подхода к лечению.</p>

<h3>Значимость исследования</h3>

<p>Результаты данного исследования могут привести к изменению стандартов лечения рака поджелудочной железы и улучшению прогноза для пациентов с этим тяжелым заболеванием. Исследование проводится в соответствии с международными стандартами GCP и одобрено этическими комитетами всех участвующих центров.</p>

<h3>Контактная информация</h3>

<p>Для получения дополнительной информации об участии в исследовании обращайтесь к координатору исследования:</p>

<ul>
<li><strong>Телефон:</strong> +7 (495) 123-45-67</li>
<li><strong>Email:</strong> research@clinic.ru</li>
<li><strong>Адрес:</strong> г. Москва, ул. Медицинская, д. 1</li>
</ul>
        ''',
        'excerpt': 'Клиническое исследование III фазы по изучению эффективности комбинированной терапии при раке поджелудочной железы. Рандомизированное контролируемое исследование с участием 300 пациентов.',
        'author': admin_user,
        'category': category,
        'is_published': True
    }
    
    # Проверяем, существует ли уже статья с таким slug
    if Article.objects.filter(slug=article_data['slug']).exists():
        print("Статья уже существует!")
        return
    
    # Создаем статью
    article = Article.objects.create(**article_data)
    article.tags.set(tags)
    
    print(f"Создана статья: {article.title}")
    print(f"Автор: {article.author.get_full_name()}")
    print(f"Категория: {article.category.name}")
    print(f"Теги: {', '.join([tag.name for tag in article.tags.all()])}")
    print(f"Опубликована: {'Да' if article.is_published else 'Нет'}")

if __name__ == '__main__':
    create_test_article()