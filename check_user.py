#!/usr/bin/env python
"""
Скрипт для проверки пользователя manager
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
django.setup()

from accounts.models import User

def check_manager():
    try:
        user = User.objects.get(email='manager@pkubg.com')
        print(f"✓ Пользователь найден:")
        print(f"  Email: {user.email}")
        print(f"  Имя: {user.first_name} {user.last_name}")
        print(f"  Роль: {user.role}")
        print(f"  Активен: {user.is_active}")
        print(f"  Staff: {user.is_staff}")
        print(f"  Superuser: {user.is_superuser}")
        
        if user.role != 'manager':
            print(f"\n⚠️  ПРОБЛЕМА: Роль должна быть 'manager', а не '{user.role}'")
            print("Исправляем...")
            user.role = 'manager'
            user.save()
            print("✓ Роль исправлена на 'manager'")
        else:
            print("\n✓ Роль правильная!")
            
    except User.DoesNotExist:
        print("✗ Пользователь manager@pkubg.com не найден!")
        print("Запустите: python create_test_data.py")

if __name__ == '__main__':
    check_manager()