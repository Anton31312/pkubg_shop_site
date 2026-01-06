from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CartAnalytics(models.Model):
    """Cart analytics model for tracking cart statistics."""
    
    date = models.DateField(auto_now_add=True)
    total_carts = models.PositiveIntegerField(default=0)
    total_items = models.PositiveIntegerField(default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ('date',)
    
    def __str__(self):
        return f"Cart Analytics for {self.date}"