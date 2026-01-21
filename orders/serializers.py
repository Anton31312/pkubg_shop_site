"""
Serializers for orders app.
"""
from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem
from products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    
    product = ProductSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'subtotal']
    
    def get_subtotal(self, obj):
        """Calculate subtotal for this item."""
        return float(obj.quantity * obj.price)


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


class AdminOrderSerializer(serializers.ModelSerializer):
    """Detailed serializer for orders (admin/manager view)."""
    
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user_email', 'user_name', 'user_phone',
            'status', 'status_display', 'payment_status', 'payment_status_display',
            'total_amount', 'shipping_address', 'delivery_method', 'delivery_tracking',
            'notes', 'items_count', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Get user's full name."""
        return f"{obj.user.first_name} {obj.user.last_name}"
    
    def get_items_count(self, obj):
        """Get total number of items in order."""
        return sum(item.quantity for item in obj.items.all())


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