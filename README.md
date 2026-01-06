# Pkubg E-commerce Platform

Интернет-магазин низкобелковой и безглютеновой продукции.

## Технологический стек

### Backend
- Django 4.2.7
- Django REST Framework
- PostgreSQL
- JWT Authentication

### Frontend
- React 18
- Redux Toolkit
- React Router
- Axios

### Тестирование
- pytest + Hypothesis (Backend)
- Jest + React Testing Library (Frontend)

### Развертывание
- Docker & Docker Compose

## Быстрый старт

### Требования
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (опционально)

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd pkubg-ecommerce
```

2. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
cd frontend && npm install
```

4. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

5. Выполните миграции:
```bash
python manage.py migrate
```

6. Запустите сервер разработки:
```bash
# Backend
python manage.py runserver

# Frontend (в отдельном терминале)
cd frontend && npm start
```

### Использование Docker

```bash
docker-compose up --build
```

## Тестирование

### Backend тесты
```bash
pytest
pytest -m property_tests  # Только property-based тесты
```

### Frontend тесты
```bash
cd frontend && npm test -- --run
```

## Структура проекта

```
pkubg-ecommerce/
├── accounts/           # Пользователи и аутентификация
├── products/           # Каталог товаров
├── orders/            # Заказы и корзина
├── articles/          # Система управления контентом
├── analytics/         # Аналитика
├── integrations/      # Внешние интеграции (Ю.Касса, СДЭК)
├── frontend/          # React приложение
├── pkubg_ecommerce/   # Настройки Django
└── requirements.txt   # Python зависимости
```

## API Документация

API будет доступно по адресу: `http://localhost:8000/api/`

Основные endpoints:
- `/api/auth/` - Аутентификация
- `/api/products/` - Товары
- `/api/cart/` - Корзина
- `/api/orders/` - Заказы
- `/api/articles/` - Статьи
- `/api/analytics/` - Аналитика