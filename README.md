# Pkubg E-commerce Platform

Интернет-магазин низкобелковой и безглютеновой продукции.

**Официальный сайт:** [pkubg.ru](https://pkubg.ru)

## О проекте

Pkubg - это специализированная платформа электронной коммерции для продажи низкобелковой и безглютеновой продукции. Проект разработан с использованием современных технологий и предоставляет полнофункциональное решение для онлайн-торговли с интегрированной системой платежей.

## Технологический стек

### Backend
- Django 4.2.7
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Robokassa Payment Integration

### Frontend
- React 18
- Redux Toolkit
- React Router
- Axios

### Тестирование
- pytest + Hypothesis (Backend)
- Jest + React Testing Library (Frontend)

### Развертывание
- Nginx (Production)
- Gunicorn WSGI Server
- SSL/TLS сертификаты (Let's Encrypt)

## Быстрый старт

### Требования
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (опционально)

### Установка для разработки

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

### Развертывание в продакшн

#### Развертывание с Nginx (без Docker)

1. Настройте продакшн окружение:
```bash
cp .env.production .env
# Отредактируйте .env файл с продакшн настройками
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
pip install gunicorn
```

3. Соберите frontend:
```bash
cd frontend
npm install
npm run build
cd ..
```

4. Соберите статику Django:
```bash
python manage.py collectstatic --noinput
python manage.py migrate
```

5. Создайте systemd сервис для Gunicorn:
```bash
sudo nano /etc/systemd/system/pkubg.service
```

Содержимое файла:
```ini
[Unit]
Description=Pkubg E-commerce Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/pkubg-ecommerce
Environment="PATH=/path/to/pkubg-ecommerce/venv/bin"
ExecStart=/path/to/pkubg-ecommerce/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    pkubg_ecommerce.wsgi:application

[Install]
WantedBy=multi-user.target
```

6. Запустите сервис:
```bash
sudo systemctl start pkubg
sudo systemctl enable pkubg
sudo systemctl status pkubg
```

7. Настройте Nginx (см. раздел "Конфигурация домена" ниже)

## Конфигурация домена

### Продакшн домен: pkubg.ru

**Настройки DNS:**
- A запись: pkubg.ru → IP сервера
- CNAME запись: www.pkubg.ru → pkubg.ru

**SSL сертификат:**
Рекомендуется использовать Let's Encrypt для получения бесплатного SSL сертификата.

**Настройки Nginx:**

Создайте файл конфигурации:
```bash
sudo nano /etc/nginx/sites-available/pkubg.ru
```

Содержимое:
```nginx
# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name pkubg.ru www.pkubg.ru;
    return 301 https://$server_name$request_uri;
}

# Основной сервер HTTPS
server {
    listen 443 ssl http2;
    server_name pkubg.ru www.pkubg.ru;
    
    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/pkubg.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pkubg.ru/privkey.pem;
    
    # SSL настройки безопасности
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Максимальный размер загружаемых файлов
    client_max_body_size 20M;
    
    # Логи
    access_log /var/log/nginx/pkubg_access.log;
    error_log /var/log/nginx/pkubg_error.log;
    
    # Статические файлы Django
    location /static/ {
        alias /path/to/pkubg-ecommerce/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Медиа файлы
    location /media/ {
        alias /path/to/pkubg-ecommerce/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # React приложение (собранный frontend)
    location / {
        root /path/to/pkubg-ecommerce/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API запросы к Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Админка Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Мониторинг
    location /monitoring/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/pkubg.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Получение SSL сертификата (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pkubg.ru -d www.pkubg.ru
```

Certbot автоматически настроит SSL и создаст задачу для автоматического обновления сертификата.

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
├── accounts/          # Пользователи и аутентификация
├── products/          # Каталог товаров
├── orders/            # Заказы и корзина
├── articles/          # Система управления контентом
├── analytics/         # Аналитика
├── integrations/      # Внешние интеграции (Robokassa)
├── frontend/          # React приложение
├── pkubg_ecommerce/   # Настройки Django
├── .env.production    # Продакшн настройки
└── requirements.txt   # Python зависимости
```

## Известные исправления

### Исправление отображения КБЖУ в форме редактирования продукта (март 2026)

**Проблема:** При редактировании продукта значения калорий, белков, жиров и углеводов всегда отображались как 0, хотя в базе данных были корректные значения.

**Причина:** В компоненте `ProductForm.js` при мерже данных из базы использовался spread оператор, который не конвертировал строковые значения в числа.

**Решение:** Явная конвертация всех значений КБЖУ через `Number()` при загрузке данных продукта:

```javascript
const mergedNutritionalInfo = product.nutritional_info ? {
  per_100g: {
    calories: Number(product.nutritional_info.per_100g?.calories) || 0,
    proteins: Number(product.nutritional_info.per_100g?.proteins) || 0.0,
    fats: Number(product.nutritional_info.per_100g?.fats) || 0.0,
    carbohydrates: Number(product.nutritional_info.per_100g?.carbohydrates) || 0.0,
    // ...
  }
} : defaultNutritionalInfo;
```

**Файл:** `frontend/src/components/ProductManagement/ProductForm.js`

## Интеграции

### Robokassa (Платежная система)

Проект интегрирован с платежной системой Robokassa для приема онлайн-платежей.

**Тестовые настройки для разработки:**

1. Зарегистрируйтесь на [Robokassa](https://robokassa.ru/)
2. Получите тестовые учетные данные
3. Добавьте настройки в `.env`:
   ```
   ROBOKASSA_MERCHANT_LOGIN=your-test-login
   ROBOKASSA_PASSWORD1=your-test-password1
   ROBOKASSA_PASSWORD2=your-test-password2
   ROBOKASSA_TEST_MODE=True
   ```

**Документация:** https://docs.robokassa.ru/pay-interface/

### Dadata (Подсказки адресов)

Интеграция с сервисом Dadata для автодополнения адресов при оформлении заказов.

## API Документация

API доступно по адресам:
- **Продакшн:** `https://pkubg.ru/api/`
- **Разработка:** `http://localhost:8000/api/`

Основные endpoints:
- `/api/auth/` - Аутентификация
- `/api/products/` - Товары
- `/api/cart/` - Корзина
- `/api/orders/` - Заказы
- `/api/articles/` - Статьи
- `/api/analytics/` - Аналитика

## Мониторинг и логирование

### Встроенная система мониторинга
Проект включает комплексную систему мониторинга:

**Веб-интерфейс мониторинга:**
- **Продакшн:** https://pkubg.ru/monitoring/
- **Разработка:** http://localhost:8000/monitoring/

**Endpoints для мониторинга:**
- `/monitoring/health/` - базовая проверка здоровья
- `/monitoring/health/detailed/` - детальные метрики системы
- `/monitoring/metrics/` - JSON метрики для dashboard
- `/monitoring/metrics/prometheus/` - метрики в формате Prometheus

**Автоматический сбор метрик:**
- 📊 Количество запросов к API
- ⏱️ Время отклика endpoints
- 🚨 Количество и типы ошибок
- 💻 Использование CPU, памяти, диска
- 🔍 Статус базы данных и кеша

### Внешние инструменты мониторинга

**Запуск полного стека мониторинга:**
```bash
# Prometheus + Grafana + AlertManager + Uptime Kuma
docker-compose -f docker-compose.monitoring.yml up -d
```

**Доступные сервисы:**
- **Grafana:** http://localhost:3001 (admin/admin_change_me)
- **Prometheus:** http://localhost:9090
- **AlertManager:** http://localhost:9093
- **Uptime Kuma:** http://localhost:3002

**Автоматический мониторинг:**
```bash
# Запуск службы мониторинга
python manage.py run_monitoring

# Одноразовая проверка
python manage.py run_monitoring --once
```

### Уведомления
- 📧 Email уведомления при критических ошибках
- 💬 Slack интеграция для команды
- 🚨 Автоматические алерты при превышении порогов

Подробная настройка: [MONITORING_SETUP.md](MONITORING_SETUP.md)

## Безопасность

### Продакшн настройки безопасности
- HTTPS принудительное перенаправление
- HSTS заголовки
- Secure cookies
- XSS защита
- CSRF защита

### Рекомендации
- Регулярно обновляйте зависимости
- Используйте сильные пароли для базы данных
- Настройте файрвол
- Регулярно создавайте резервные копии

## Полезные команды для управления сервером

### Управление Gunicorn сервисом
```bash
# Проверка статуса
sudo systemctl status pkubg

# Перезапуск после изменений в коде
sudo systemctl restart pkubg

# Просмотр логов
sudo journalctl -u pkubg -f

# Остановка сервиса
sudo systemctl stop pkubg
```

### Управление Nginx
```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка конфигурации
sudo systemctl reload nginx

# Перезапуск Nginx
sudo systemctl restart nginx

# Просмотр логов
sudo tail -f /var/log/nginx/pkubg_access.log
sudo tail -f /var/log/nginx/pkubg_error.log
```

### Обновление приложения
```bash
# 1. Получить последние изменения
git pull origin main

# 2. Обновить зависимости (если изменились)
source venv/bin/activate
pip install -r requirements.txt

# 3. Применить миграции
python manage.py migrate

# 4. Собрать статику
python manage.py collectstatic --noinput

# 5. Пересобрать frontend (если изменился)
cd frontend
npm install
npm run build
cd ..

# 6. Перезапустить Gunicorn
sudo systemctl restart pkubg
```

### Резервное копирование базы данных
```bash
# Создать бэкап PostgreSQL
pg_dump -U postgres pkubg_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
psql -U postgres pkubg_db < backup_20260303_120000.sql
```

### Мониторинг ресурсов
```bash
# Использование памяти процессом Gunicorn
ps aux | grep gunicorn

# Использование диска
df -h

# Свободная память
free -h

# Активные соединения к Nginx
sudo netstat -tuln | grep :80
sudo netstat -tuln | grep :443
```
