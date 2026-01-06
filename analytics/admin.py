from django.contrib import admin
from .models import CartAnalytics


@admin.register(CartAnalytics)
class CartAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_carts', 'total_items', 'total_value')
    list_filter = ('date',)
    readonly_fields = ('date',)