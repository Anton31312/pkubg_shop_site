"""
Django settings for pkubg_ecommerce project.
"""

from pathlib import Path
from decouple import config
from datetime import timedelta

# Patch for DRF format suffix converter issue with Django 5.x
import django.urls.converters as converters
if not hasattr(converters, '_drf_patched'):
    original_register = converters.register_converter
    def patched_register(converter, type_name):
        if type_name == 'drf_format_suffix':
            if type_name in converters.get_converters():
                return
        original_register(converter, type_name)
    converters.register_converter = patched_register
    converters._drf_patched = True

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'csp',  # Django CSP
]

LOCAL_APPS = [
    'accounts',
    'products',
    'orders',
    'articles',
    'analytics',
    'integrations',
    'monitoring',
    'legal',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware',  # CSP middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'monitoring.metrics.MetricsMiddleware',
]

ROOT_URLCONF = 'pkubg_ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'pkubg_ecommerce.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Use PostgreSQL in production
if not DEBUG or config('USE_POSTGRES', default=False, cast=bool):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='pkubg_ecommerce'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='postgres'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 1000,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # Увеличено до 24 часов
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),  # Увеличено до 30 дней
    'ROTATE_REFRESH_TOKENS': True,
}

# Session Settings
SESSION_COOKIE_AGE = 86400  # 24 часа в секундах
SESSION_SAVE_EVERY_REQUEST = True  # Обновлять сессию при каждом запросе

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://pkubg.ru",
    "https://www.pkubg.ru",
]

CORS_ALLOW_CREDENTIALS = True

# YooKassa Settings (deprecated, use RoboKassa)
YOOKASSA_SHOP_ID = config('YOOKASSA_SHOP_ID', default='test_shop_id')
YOOKASSA_SECRET_KEY = config('YOOKASSA_SECRET_KEY', default='test_secret_key')
YOOKASSA_BASE_URL = config('YOOKASSA_BASE_URL', default='https://api.yookassa.ru/v3')

# RoboKassa Settings
ROBOKASSA_MERCHANT_LOGIN = config('ROBOKASSA_MERCHANT_LOGIN', default='')
ROBOKASSA_PASSWORD1 = config('ROBOKASSA_PASSWORD1', default='')
ROBOKASSA_PASSWORD2 = config('ROBOKASSA_PASSWORD2', default='')
ROBOKASSA_TEST_MODE = config('ROBOKASSA_TEST_MODE', default=True, cast=bool)

# Dadata Settings
DADATA_API_KEY = config('DADATA_API_KEY', default='')

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'integrations': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Content Security Policy Settings
# Строгая политика безопасности согласно рекомендациям web.dev
# https://web.dev/articles/csp

# Базовые настройки CSP
CSP_DEFAULT_SRC = ("'self'",)

# Скрипты: только с нашего домена, без eval и inline
# Для React production build это безопасно
CSP_SCRIPT_SRC = ("'self'",)

# Стили: разрешаем inline стили для React (через nonce в будущем)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")  # TODO: заменить на nonce

# Изображения: разрешаем с нашего домена, data URIs и внешние HTTPS
CSP_IMG_SRC = ("'self'", "data:", "blob:", "https:")

# Шрифты
CSP_FONT_SRC = ("'self'", "data:")

# API соединения: наш домен + внешние API
CSP_CONNECT_SRC = (
    "'self'",
    "https://suggestions.dadata.ru",  # Dadata API
    "https://api.robokassa.ru",       # Robokassa API
)

# Медиа файлы
CSP_MEDIA_SRC = ("'self'", "blob:", "data:")

# Запрещаем плагины (Flash и т.д.)
CSP_OBJECT_SRC = ("'none'",)

# Базовый URI
CSP_BASE_URI = ("'self'",)

# Запрещаем iframe embedding нашего сайта
CSP_FRAME_ANCESTORS = ("'none'",)

# Формы: только на наш домен и Robokassa
CSP_FORM_ACTION = ("'self'", "https://auth.robokassa.ru")

# Обновляем небезопасные запросы HTTP -> HTTPS
CSP_UPGRADE_INSECURE_REQUESTS = True

# Отчеты о нарушениях CSP
CSP_REPORT_URI = '/api/csp-report/'

# В режиме разработки используем report-only для тестирования
if DEBUG:
    CSP_REPORT_ONLY = True
    # В dev режиме разрешаем eval для hot reload
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-eval'")
    CSP_CONNECT_SRC = CSP_CONNECT_SRC + ("ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*")

# ============================================================================
# ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ БЕЗОПАСНОСТИ
# ============================================================================

# HTTPS и SSL настройки
if not DEBUG:
    # Принудительное перенаправление на HTTPS
    SECURE_SSL_REDIRECT = True
    
    # HTTP Strict Transport Security (HSTS)
    SECURE_HSTS_SECONDS = 31536000  # 1 год
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Защита от MIME-type sniffing
    SECURE_CONTENT_TYPE_NOSNIFF = True
    
    # Защита от XSS в старых браузерах
    SECURE_BROWSER_XSS_FILTER = True
    
    # Secure cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HTTPOnly cookies (защита от XSS)
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    
    # SameSite cookies (защита от CSRF)
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    
    # Proxy SSL header (для работы за nginx)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Защита от Clickjacking
X_FRAME_OPTIONS = 'DENY'

# Дополнительные заголовки безопасности
# Эти заголовки можно также настроить в nginx для лучшей производительности
SECURE_REFERRER_POLICY = 'same-origin'

# Ограничение размера загружаемых файлов (20MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB

# Настройки паролей
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,  # Минимум 8 символов
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Логирование безопасности
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'pkubg_ecommerce': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ============================================================================
# EMAIL SETTINGS
# ============================================================================

if DEBUG:
    # Для тестирования — выводит письма в консоль
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    # Для продакшена — Mail.ru SMTP
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.mail.ru'
    EMAIL_PORT = 465
    EMAIL_USE_SSL = True
    EMAIL_USE_TLS = False
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# ============================================================================
# VK Notifications
# ============================================================================
VK_GROUP_TOKEN = config('VK_GROUP_TOKEN', default='')
VK_ADMIN_IDS = config('VK_ADMIN_IDS', default='', cast=lambda v: [int(x.strip()) for x in v.split(',') if x.strip()])

# Создаем директорию для логов если её нет
import os
logs_dir = BASE_DIR / 'logs'
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)
