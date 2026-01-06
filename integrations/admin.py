from django.contrib import admin
from .models import PaymentTransaction, DeliveryRequest


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'order', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('payment_id', 'order__order_number')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ('cdek_order_id', 'order', 'status', 'pickup_point', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('cdek_order_id', 'order__order_number', 'tracking_number')
    readonly_fields = ('created_at', 'updated_at')