#!/usr/bin/env python
"""
Скрипт для проверки настроек безопасности Django приложения.
Запуск: python check_security.py
"""

import os
import sys
import django

# Настройка Django окружения
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from django.conf import settings
from django.core.management import call_command

def check_security_settings():
    """Проверка критичных настроек безопасности."""
    issues = []
    warnings = []
    
    print("=" * 70)
    print("ПРОВЕРКА НАСТРОЕК БЕЗОПАСНОСТИ PKUBG E-COMMERCE")
    print("=" * 70)
    print()
    
    # Проверка DEBUG режима
    if settings.DEBUG:
        warnings.append("⚠️  DEBUG=True - НЕ используйте в production!")
    else:
        print("✅ DEBUG отключен")
    
    # Проверка SECRET_KEY
    if settings.SECRET_KEY == 'django-insecure-default-key':
        issues.append("❌ SECRET_KEY использует значение по умолчанию!")
    else:
        print("✅ SECRET_KEY настроен")
    
    # Проверка ALLOWED_HOSTS
    if not settings.ALLOWED_HOSTS or settings.ALLOWED_HOSTS == ['*']:
        issues.append("❌ ALLOWED_HOSTS не настроен или разрешает все хосты!")
    else:
        print(f"✅ ALLOWED_HOSTS: {', '.join(settings.ALLOWED_HOSTS)}")
    
    # Проверка HTTPS настроек
    if not settings.DEBUG:
        if getattr(settings, 'SECURE_SSL_REDIRECT', False):
            print("✅ HTTPS редирект включен")
        else:
            warnings.append("⚠️  SECURE_SSL_REDIRECT отключен")
        
        if getattr(settings, 'SECURE_HSTS_SECONDS', 0) > 0:
            print(f"✅ HSTS включен ({settings.SECURE_HSTS_SECONDS} секунд)")
        else:
            warnings.append("⚠️  HSTS не настроен")
        
        if getattr(settings, 'SESSION_COOKIE_SECURE', False):
            print("✅ Secure cookies включены")
        else:
            issues.append("❌ SESSION_COOKIE_SECURE отключен!")
    
    # Проверка CSP
    if hasattr(settings, 'CSP_DEFAULT_SRC'):
        print("✅ Content Security Policy настроен")
        
        # Проверка на небезопасные директивы
        csp_script_src = getattr(settings, 'CSP_SCRIPT_SRC', ())
        if "'unsafe-eval'" in csp_script_src and not settings.DEBUG:
            issues.append("❌ CSP_SCRIPT_SRC содержит 'unsafe-eval' в production!")
        elif "'unsafe-eval'" not in csp_script_src:
            print("✅ CSP без 'unsafe-eval'")
        
        if "'unsafe-inline'" in csp_script_src:
            warnings.append("⚠️  CSP_SCRIPT_SRC содержит 'unsafe-inline'")
    else:
        warnings.append("⚠️  Content Security Policy не настроен")
    
    # Проверка X-Frame-Options
    if getattr(settings, 'X_FRAME_OPTIONS', None) in ['DENY', 'SAMEORIGIN']:
        print(f"✅ X-Frame-Options: {settings.X_FRAME_OPTIONS}")
    else:
        warnings.append("⚠️  X_FRAME_OPTIONS не настроен")
    
    # Проверка CORS
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
        if settings.CORS_ALLOWED_ORIGINS:
            print(f"✅ CORS настроен для {len(settings.CORS_ALLOWED_ORIGINS)} источников")
        else:
            warnings.append("⚠️  CORS_ALLOWED_ORIGINS пуст")
    
    # Проверка базы данных
    db_engine = settings.DATABASES['default']['ENGINE']
    if 'sqlite' in db_engine and not settings.DEBUG:
        warnings.append("⚠️  SQLite используется в production - рекомендуется PostgreSQL")
    else:
        print(f"✅ База данных: {db_engine.split('.')[-1]}")
    
    print()
    print("=" * 70)
    
    # Вывод предупреждений
    if warnings:
        print("\n⚠️  ПРЕДУПРЕЖДЕНИЯ:")
        for warning in warnings:
            print(f"  {warning}")
    
    # Вывод критичных проблем
    if issues:
        print("\n❌ КРИТИЧНЫЕ ПРОБЛЕМЫ:")
        for issue in issues:
            print(f"  {issue}")
        print("\n⚠️  Исправьте критичные проблемы перед деплоем!")
    
    if not issues and not warnings:
        print("\n✅ Все проверки пройдены успешно!")
    
    print("=" * 70)
    print()
    
    return len(issues) == 0

def run_django_check():
    """Запуск встроенной проверки Django."""
    print("\nЗапуск Django security check...")
    print("-" * 70)
    try:
        call_command('check', '--deploy')
        print("✅ Django check пройден")
    except Exception as e:
        print(f"❌ Django check обнаружил проблемы: {e}")
    print("-" * 70)
    print()

if __name__ == '__main__':
    try:
        # Проверка настроек
        success = check_security_settings()
        
        # Django встроенная проверка
        run_django_check()
        
        # Рекомендации
        print("\n📚 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:")
        print("  1. Регулярно обновляйте зависимости: pip list --outdated")
        print("  2. Проверяйте npm пакеты: cd frontend && npm audit")
        print("  3. Используйте Mozilla Observatory: https://observatory.mozilla.org/")
        print("  4. Проверяйте SSL: https://www.ssllabs.com/ssltest/")
        print("  5. Мониторьте логи безопасности: tail -f logs/security.log")
        print()
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        print(f"\n❌ Ошибка при проверке: {e}")
        sys.exit(1)
