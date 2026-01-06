from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for custom User model."""
    
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('phone', 'role', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for UserProfile model."""
    
    list_display = ('user', 'birth_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    list_filter = ('birth_date',)