"""
Views for orders app.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum

from .models import Cart, CartItem, Order, OrderItem
from .permissions import IsAdminOrManager, IsAdminOrManagerOrOwner
from .serializers import AdminOrderSerializer
from products.models import Product


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    """Get user's cart contents."""
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    cart_data = {
        'items': [],
        'count': cart.total_items,
        'total': float(cart.total_amount)
    }
    
    for item in cart.items.select_related('product').prefetch_related('product__images'):
        # Get primary image or first available image
        primary_image = None
        if item.product.images.exists():
            primary_image = item.product.images.filter(is_primary=True).first()
            if not primary_image:
                primary_image = item.product.images.first()
        
        cart_data['items'].append({
            'id': item.id,
            'product': {
                'id': item.product.id,
                'name': item.product.name,
                'price': float(item.product.price),
                'slug': item.product.slug,
                'is_gluten_free': item.product.is_gluten_free,
                'is_low_protein': item.product.is_low_protein,
                'images': [{
                    'image': primary_image.image.url if primary_image else None,
                    'alt_text': primary_image.alt_text if primary_image else item.product.name,
                    'is_primary': True
                }] if primary_image else []
            },
            'quantity': item.quantity,
            'price': float(item.product.price),
            'subtotal': float(item.quantity * item.product.price)
        })
    
    return Response(cart_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add item to cart."""
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)
    
    if not product_id:
        return Response(
            {'error': 'Product ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        quantity = int(quantity)
        if quantity <= 0:
            return Response(
                {'error': 'Quantity must be positive'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid quantity'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    product = get_object_or_404(Product, id=product_id, is_active=True)
    
    # Check stock availability and limit quantity
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    # Get current quantity in cart for this product
    existing_item = cart.items.filter(product=product).first()
    current_quantity_in_cart = existing_item.quantity if existing_item else 0
    available_quantity = product.stock_quantity - current_quantity_in_cart
    
    # Limit the quantity to what's actually available
    actual_quantity = min(quantity, available_quantity)
    
    if actual_quantity > 0:
        cart.add_item(product, actual_quantity)
    # If actual_quantity is 0 or less, just don't add anything (no error)
    
    return Response({
        'message': 'Item added to cart',
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request):
    """Update quantity of item in cart."""
    item_id = request.data.get('item_id')
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity')
    
    # Debug logging
    print(f"Update cart item - item_id: {item_id}, product_id: {product_id}, quantity: {quantity}")
    print(f"Request data: {request.data}")
    
    if not item_id and not product_id:
        return Response(
            {'error': 'Item ID or Product ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if quantity is None:
        return Response(
            {'error': 'Quantity is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        quantity = int(quantity)
        if quantity < 0:
            return Response(
                {'error': 'Quantity cannot be negative'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid quantity'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    # Handle update by item_id or product_id
    if item_id:
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
            product = cart_item.product
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        product = get_object_or_404(Product, id=product_id)
    
    if quantity == 0:
        cart.remove_item(product)
        message = 'Item removed from cart'
    else:
        # Limit quantity to available stock instead of returning error
        actual_quantity = min(quantity, product.stock_quantity)
        cart.update_item_quantity(product, actual_quantity)
        message = 'Cart updated'
    
    return Response({
        'message': message,
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    """Remove item from cart."""
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    try:
        cart_item = CartItem.objects.get(id=item_id, cart=cart)
        product = cart_item.product
        removed = cart.remove_item(product)
    except CartItem.DoesNotExist:
        removed = False
    
    if removed:
        message = 'Item removed from cart'
    else:
        message = 'Item not found in cart'
    
    return Response({
        'message': message,
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """Get user's order history."""
    from .models import Order
    
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    orders_data = []
    for order in orders:
        order_items = []
        for item in order.items.select_related('product').prefetch_related('product__images'):
            # Get primary image or first available image
            primary_image = None
            if item.product.images.exists():
                primary_image = item.product.images.filter(is_primary=True).first()
                if not primary_image:
                    primary_image = item.product.images.first()
            
            order_items.append({
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'slug': item.product.slug,
                    'images': [{
                        'image': primary_image.image.url if primary_image else None,
                        'alt_text': primary_image.alt_text if primary_image else item.product.name,
                        'is_primary': True
                    }] if primary_image else []
                },
                'quantity': item.quantity,
                'price': float(item.price),
                'subtotal': float(item.quantity * item.price)
            })
        
        orders_data.append({
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'payment_status': order.payment_status,
            'total_amount': float(order.total_amount),
            'shipping_address': order.shipping_address,
            'delivery_method': order.delivery_method,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat(),
            'items': order_items
        })
    
    return Response({
        'orders': orders_data,
        'count': len(orders_data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create order from cart."""
    from .models import Order, OrderItem
    import uuid
    
    try:
        cart = Cart.objects.get(user=request.user)
        
        if not cart.items.exists():
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order data from request
        shipping_address = request.data.get('shipping_address', '')
        delivery_method = request.data.get('delivery_method', 'courier')
        notes = request.data.get('notes', '')
        
        if not shipping_address:
            return Response(
                {'error': 'Shipping address is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
            total_amount=cart.total_amount,
            shipping_address=shipping_address,
            delivery_method=delivery_method,
            notes=notes,
            status='pending',
            payment_status='pending'
        )
        
        # Create order items from cart
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
        
        # Clear cart
        cart.items.all().delete()
        
        return Response({
            'order_id': order.id,
            'order_number': order.order_number,
            'total_amount': float(order.total_amount),
            'status': order.status,
            'payment_status': order.payment_status
        })
        
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to create order: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_cart_update(request):
    """Test endpoint for debugging cart updates."""
    print("=== TEST CART UPDATE ===")
    print(f"Request method: {request.method}")
    print(f"Request data: {request.data}")
    print(f"Request user: {request.user}")
    
    return Response({
        'message': 'Test successful',
        'received_data': request.data,
        'user': str(request.user)
    })



@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def admin_get_all_orders(request):
    """
    Get all orders for admin/manager view.
    Supports filtering by status, payment_status, and search by order_number or user email.
    """
    orders = Order.objects.select_related('user').prefetch_related(
        'items', 'items__product', 'items__product__images'
    ).order_by('-created_at')
    
    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    # Filter by payment status
    payment_status_filter = request.query_params.get('payment_status')
    if payment_status_filter:
        orders = orders.filter(payment_status=payment_status_filter)
    
    # Search by order number or user email
    search = request.query_params.get('search')
    if search:
        orders = orders.filter(
            Q(order_number__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search)
        )
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    start = (page - 1) * page_size
    end = start + page_size
    
    total_count = orders.count()
    orders_page = orders[start:end]
    
    serializer = AdminOrderSerializer(orders_page, many=True)
    
    return Response({
        'orders': serializer.data,
        'total': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size
    })


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrOwner])
def admin_get_order_detail(request, order_id):
    """
    Get detailed information about a specific order.
    Admins/managers can view any order, users can only view their own.
    """
    order = get_object_or_404(
        Order.objects.select_related('user').prefetch_related(
            'items', 'items__product', 'items__product__images'
        ),
        id=order_id
    )
    
    # Check permissions
    if request.user.role not in ['admin', 'manager'] and order.user != request.user:
        return Response(
            {'error': 'У вас нет прав для просмотра этого заказа'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AdminOrderSerializer(order)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminOrManager])
def admin_update_order_status(request, order_id):
    """
    Update order status or payment status.
    Only admins and managers can update orders.
    """
    order = get_object_or_404(Order, id=order_id)
    
    # Update status if provided
    new_status = request.data.get('status')
    if new_status and new_status in dict(Order.ORDER_STATUS_CHOICES):
        order.status = new_status
    
    # Update payment status if provided
    new_payment_status = request.data.get('payment_status')
    if new_payment_status and new_payment_status in dict(Order.PAYMENT_STATUS_CHOICES):
        order.payment_status = new_payment_status
    
    # Update delivery tracking if provided
    delivery_tracking = request.data.get('delivery_tracking')
    if delivery_tracking is not None:
        order.delivery_tracking = delivery_tracking
    
    order.save()
    
    serializer = AdminOrderSerializer(order)
    return Response({
        'message': 'Заказ успешно обновлен',
        'order': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def admin_get_order_statistics(request):
    """
    Get order statistics for admin/manager dashboard.
    """
    from decimal import Decimal
    
    # Total orders
    total_orders = Order.objects.count()
    
    # Orders by status
    orders_by_status = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Orders by payment status
    orders_by_payment_status = Order.objects.values('payment_status').annotate(
        count=Count('id')
    ).order_by('payment_status')
    
    # Total revenue (only paid orders)
    total_revenue = Order.objects.filter(
        payment_status='paid'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Recent orders (last 10)
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    recent_orders_data = AdminOrderSerializer(recent_orders, many=True).data
    
    return Response({
        'total_orders': total_orders,
        'orders_by_status': list(orders_by_status),
        'orders_by_payment_status': list(orders_by_payment_status),
        'total_revenue': float(total_revenue),
        'recent_orders': recent_orders_data
    })
