from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()


class Cart(models.Model):
    """Shopping cart model."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
    @property
    def total_items(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items.all())
    
    @property
    def total_amount(self):
        """Get total amount of all items in cart."""
        from decimal import Decimal
        return sum(item.quantity * item.product.price for item in self.items.all()) or Decimal('0.00')
    
    def add_item(self, product, quantity=1):
        """Add item to cart or update quantity if exists."""
        cart_item, created = self.items.get_or_create(
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        return cart_item
    
    def update_item_quantity(self, product, quantity):
        """Update quantity of specific item in cart."""
        try:
            cart_item = self.items.get(product=product)
            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
            return cart_item
        except CartItem.DoesNotExist:
            return None
    
    def remove_item(self, product):
        """Remove item from cart."""
        try:
            cart_item = self.items.get(product=product)
            cart_item.delete()
            return True
        except CartItem.DoesNotExist:
            return False


class CartItem(models.Model):
    """Cart item model."""
    
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('cart', 'product')
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"


class Order(models.Model):
    """Order model."""
    
    ORDER_STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('paid', 'Оплачен'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('paid', 'Оплачен'),
        ('failed', 'Ошибка оплаты'),
        ('refunded', 'Возвращен'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    delivery_method = models.CharField(max_length=50)
    delivery_tracking = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order {self.order_number}"


class OrderItem(models.Model):
    """Order item model."""
    
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} in {self.order.order_number}"