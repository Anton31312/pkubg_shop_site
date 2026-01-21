from django.db import models


class PaymentTransaction(models.Model):
    """Payment transaction model for payment integrations."""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('waiting_for_capture', 'Ожидает подтверждения'),
        ('succeeded', 'Успешно'),
        ('canceled', 'Отменен'),
    ]
    
    PAYMENT_SYSTEM_CHOICES = [
        ('robokassa', 'Robokassa'),
        ('yookassa', 'ЮKassa'),  # Оставлено для совместимости со старыми записями
    ]
    
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE)
    payment_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_system = models.CharField(max_length=20, choices=PAYMENT_SYSTEM_CHOICES, default='robokassa')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.payment_id} ({self.payment_system}) for {self.order.order_number}"


class DeliveryRequest(models.Model):
    """Delivery request model for СДЭК integration."""
    
    STATUS_CHOICES = [
        ('created', 'Создан'),
        ('accepted', 'Принят'),
        ('in_transit', 'В пути'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]
    
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE)
    cdek_order_id = models.CharField(max_length=100, unique=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    pickup_point = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Delivery {self.cdek_order_id} for {self.order.order_number}"