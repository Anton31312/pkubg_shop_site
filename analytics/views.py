"""
Analytics views for cart statistics.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from orders.models import Cart, CartItem


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cart_statistics(request):
    """
    Get cart statistics for admin analytics panel.
    Returns total items count and total value across all active carts.
    """
    # Get all active carts (carts that haven't been converted to orders)
    active_carts = Cart.objects.filter(
        items__isnull=False
    ).distinct()
    
    # Calculate total items across all carts
    total_items = CartItem.objects.aggregate(
        total=Sum('quantity')
    )['total'] or 0
    
    # Calculate total value across all carts
    total_value = sum(
        cart.total_amount for cart in active_carts
    )
    
    # Count of active carts
    total_carts = active_carts.count()
    
    return Response({
        'total_carts': total_carts,
        'total_items': total_items,
        'total_value': float(total_value),
        'timestamp': request.META.get('HTTP_DATE', None)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def real_time_cart_stats(request):
    """
    Get real-time cart statistics that update when carts change.
    """
    return cart_statistics(request)