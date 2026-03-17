from django.contrib import admin
from .models import LegalInfo


@admin.register(LegalInfo)
class LegalInfoAdmin(admin.ModelAdmin):
    """Также доступно через Django admin"""

    fieldsets = (
        ('Данные ИП', {
            'fields': (
                'business_type', 'full_name', 'short_name',
                'ogrnip', 'inn'
            )
        }),
        ('Адрес', {
            'fields': ('legal_address', 'postal_code')
        }),
        ('Контакты', {
            'fields': ('email', 'phone', 'working_hours')
        }),
        ('Банковские реквизиты', {
            'fields': (
                'bank_name', 'bik',
                'checking_account', 'correspondent_account'
            )
        }),
        ('Сайт и бренд', {
            'fields': (
                'site_name', 'site_url', 'site_description'
            )
        }),
        ('Социальные сети', {
            'fields': ('telegram_url', 'vk_url', 'ozon_url')
        }),
    )

    def has_add_permission(self, request):
        """Запретить создание второй записи"""
        return not LegalInfo.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Запретить удаление"""
        return False