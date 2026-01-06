from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with additional fields."""
    
    ROLE_CHOICES = [
        ('customer', 'Покупатель'),
        ('manager', 'Менеджер'),
        ('admin', 'Администратор'),
    ]
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"


class UserProfile(models.Model):
    """Extended user profile information."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    dietary_preferences = models.JSONField(default=dict)
    
    def __str__(self):
        return f"Профиль {self.user.email}"