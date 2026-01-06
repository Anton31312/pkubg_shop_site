"""
Serializers for orders app.
"""
from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem
from products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders."""
    
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 
            'payment_status', 'payment_status_display', 'total_amount',
            'shipping_address', 'delivery_method', 'delivery_tracking',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items."""
    
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart."""
    
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']