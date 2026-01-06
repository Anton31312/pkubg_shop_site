"""
Global pytest configuration and fixtures for the project.
"""
import pytest
import django
from django.conf import settings
from hypothesis import settings as hypothesis_settings

# Configure Hypothesis for property-based testing
hypothesis_settings.register_profile("default", max_examples=100, deadline=None)
hypothesis_settings.load_profile("default")

# Configure Django settings for pytest
if not settings.configured:
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pkubg_ecommerce.settings')
    django.setup()


@pytest.fixture
def api_client():
    """Fixture for Django REST framework test client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def user_factory():
    """Factory for creating test users."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    def _create_user(**kwargs):
        defaults = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)
    return _create_user


@pytest.fixture
def admin_user():
    """Fixture for creating admin user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )