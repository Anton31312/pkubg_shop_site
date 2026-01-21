from django.contrib import admin
from django.utils.html import format_html
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'added_at')
    can_delete = False


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items', 'total_amount', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    inlines = [CartItemInline]
    readonly_fields = ('created_at', 'updated_at', 'total_items', 'total_amount')
    
    def has_add_permission(self, request):
        return False


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price', 'get_subtotal')
    can_delete = False
    
    def get_subtotal(self, obj):
        """Display subtotal for each item."""
        return f"{obj.quantity * obj.price:.2f} ₽"
    get_subtotal.short_description = 'Подытог'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 
        'get_user_info', 
        'get_status_badge',
        'get_payment_status_badge',
        'total_amount', 
        'get_items_count',
        'created_at'
    )
    list_filter = ('status', 'payment_status', 'delivery_method', 'created_at')
    search_fields = (
        'order_number', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'shipping_address'
    )
    readonly_fields = (
        'order_number', 
        'user', 
        'total_amount', 
        'created_at', 
        'updated_at',
        'get_items_count'
    )
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Информация о заказе', {
            'fields': ('order_number', 'user', 'created_at', 'updated_at')
        }),
        ('Статус', {
            'fields': ('status', 'payment_status')
        }),
        ('Детали заказа', {
            'fields': ('total_amount', 'get_items_count', 'notes')
        }),
        ('Доставка', {
            'fields': ('delivery_method', 'shipping_address', 'delivery_tracking')
        }),
    )
    
    def get_user_info(self, obj):
        """Display user information."""
        return f"{obj.user.first_name} {obj.user.last_name} ({obj.user.email})"
    get_user_info.short_description = 'Покупатель'
    
    def get_status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'pending': '#FFA500',
            'paid': '#4CAF50',
            'processing': '#2196F3',
            'shipped': '#9C27B0',
            'delivered': '#4CAF50',
            'cancelled': '#F44336',
        }
        color = colors.get(obj.status, '#999')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    get_status_badge.short_description = 'Статус заказа'
    
    def get_payment_status_badge(self, obj):
        """Display payment status with color badge."""
        colors = {
            'pending': '#FFA500',
            'paid': '#4CAF50',
            'failed': '#F44336',
            'refunded': '#9E9E9E',
        }
        color = colors.get(obj.payment_status, '#999')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_payment_status_display()
        )
    get_payment_status_badge.short_description = 'Статус оплаты'
    
    def get_items_count(self, obj):
        """Display total number of items."""
        return sum(item.quantity for item in obj.items.all())
    get_items_count.short_description = 'Количество товаров'
    
    def has_add_permission(self, request):
        """Disable adding orders through admin."""
        return False
