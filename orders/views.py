"""
Views for orders app.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
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
                'is_lactose_free': item.product.is_lactose_free,
                'is_egg_free': item.product.is_egg_free,
                'stock_quantity': item.product.stock_quantity,
                'available_quantity': item.product.available_quantity,
                'images': [{
                    'image': request.build_absolute_uri(primary_image.image.url) if primary_image else None,
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
    """Add item to cart with stock reservation."""
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
    
    with transaction.atomic():
        # Блокируем продукт для атомарного обновления
        product = Product.objects.select_for_update().get(id=product_id)
        
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        # Текущее количество в корзине
        existing_item = cart.items.filter(product=product).first()
        current_in_cart = existing_item.quantity if existing_item else 0
        
        # Сколько доступно для добавления
        available = product.available_quantity
        actual_quantity = min(quantity, available)
        
        if actual_quantity <= 0:
            return Response(
                {
                    'error': 'Товар недоступен для добавления',
                    'message': f'Доступно: {available} шт.',
                    'type': 'STOCK_UNAVAILABLE'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Резервируем товар
        product.reserve(actual_quantity)
        
        # Добавляем в корзину
        if existing_item:
            existing_item.quantity += actual_quantity
            existing_item.save()
        else:
            CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=actual_quantity
            )
    
    cart.refresh_from_db()
    
    return Response({
        'message': 'Item added to cart',
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request):
    """Update quantity of item in cart with reservation adjustment."""
    item_id = request.data.get('item_id')
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity')
    
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
    
    with transaction.atomic():
        # Находим элемент корзины
        if item_id:
            try:
                cart_item = CartItem.objects.select_related('product').get(id=item_id, cart=cart)
            except CartItem.DoesNotExist:
                return Response(
                    {'error': 'Cart item not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            product_obj = get_object_or_404(Product, id=product_id)
            try:
                cart_item = CartItem.objects.select_related('product').get(product=product_obj, cart=cart)
            except CartItem.DoesNotExist:
                return Response(
                    {'error': 'Cart item not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        product = Product.objects.select_for_update().get(id=cart_item.product.id)
        old_quantity = cart_item.quantity
        diff = quantity - old_quantity
        
        if quantity == 0:
            # Удаление — снимаем весь резерв
            product.release_reserve(old_quantity)
            cart_item.delete()
            message = 'Item removed from cart'
        elif diff > 0:
            # Увеличение — резервируем дополнительно
            available = product.available_quantity
            actual_diff = min(diff, available)
            
            if actual_diff <= 0:
                return Response(
                    {
                        'error': 'Недостаточно товара',
                        'message': f'Доступно: {available} шт.',
                        'type': 'INSUFFICIENT_STOCK'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            product.reserve(actual_diff)
            cart_item.quantity = old_quantity + actual_diff
            cart_item.save()
            message = 'Cart updated'
        elif diff < 0:
            # Уменьшение — снимаем часть резерва
            product.release_reserve(abs(diff))
            cart_item.quantity = quantity
            cart_item.save()
            message = 'Cart updated'
        else:
            message = 'No changes'
    
    cart.refresh_from_db()
    
    return Response({
        'message': message,
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    """Remove item from cart and release reservation."""
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    with transaction.atomic():
        try:
            cart_item = CartItem.objects.select_related('product').get(id=item_id, cart=cart)
            product = Product.objects.select_for_update().get(id=cart_item.product.id)
            
            # Снимаем резерв
            product.release_reserve(cart_item.quantity)
            cart_item.delete()
            removed = True
        except CartItem.DoesNotExist:
            removed = False
    
    return Response({
        'message': 'Item removed from cart' if removed else 'Item not found in cart',
        'count': cart.total_items,
        'total': float(cart.total_amount)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create order from cart — deduct stock, clear reservations."""
    import uuid
    
    try:
        cart = Cart.objects.get(user=request.user)
        
        if not cart.items.exists():
            return Response(
                {'error': 'Cart is empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        shipping_address = request.data.get('shipping_address', '')
        delivery_method = request.data.get('delivery_method', 'courier')
        notes = request.data.get('notes', '')
        
        if not shipping_address:
            return Response(
                {'error': 'Shipping address is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Создаём заказ
            order = Order.objects.create(
                user=request.user,
                order_number=f'ORD-{uuid.uuid4().hex[:8].upper()}',
                total_amount=cart.total_amount,
                shipping_address=shipping_address,
                delivery_method=delivery_method,
                notes=notes,
                status='processing',
                payment_status='pending'
            )
            
            # Переносим товары из корзины в заказ и списываем со склада
            for cart_item in cart.items.select_related('product'):
                product = Product.objects.select_for_update().get(id=cart_item.product.id)
                
                # Списываем со склада (и снимаем резерв)
                product.deduct_stock(cart_item.quantity)
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=cart_item.quantity,
                    price=product.price
                )
            
            # Очищаем корзину
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
    except ValueError as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to create order: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """Get user's order history."""
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    orders_data = []
    for order in orders:
        order_items = []
        for item in order.items.select_related('product').prefetch_related('product__images'):
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
                        'image': request.build_absolute_uri(primary_image.image.url) if primary_image else None,
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


# ═══ ADMIN VIEWS ═══

@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def admin_get_all_orders(request):
    """Get all orders for admin/manager view."""
    orders = Order.objects.select_related('user').prefetch_related(
        'items', 'items__product', 'items__product__images'
    ).order_by('-created_at')
    
    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    payment_status_filter = request.query_params.get('payment_status')
    if payment_status_filter:
        orders = orders.filter(payment_status=payment_status_filter)
    
    search = request.query_params.get('search')
    if search:
        orders = orders.filter(
            Q(order_number__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search)
        )
    
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
    """Get detailed information about a specific order."""
    order = get_object_or_404(
        Order.objects.select_related('user').prefetch_related(
            'items', 'items__product', 'items__product__images'
        ),
        id=order_id
    )
    
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
    """Update order status with stock management."""
    order = get_object_or_404(Order, id=order_id)
    old_status = order.status
    
    new_status = request.data.get('status')
    if new_status and new_status in dict(Order.ORDER_STATUS_CHOICES):
        # Если заказ отменяется — вернуть товары на склад
        if new_status == 'cancelled' and old_status != 'cancelled':
            with transaction.atomic():
                for item in order.items.select_related('product'):
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.return_stock(item.quantity)
                
                order.status = new_status
                order.save()
        else:
            order.status = new_status
    
    new_payment_status = request.data.get('payment_status')
    if new_payment_status and new_payment_status in dict(Order.PAYMENT_STATUS_CHOICES):
        # Если возврат — вернуть товары на склад
        if new_payment_status == 'refunded' and order.payment_status != 'refunded':
            with transaction.atomic():
                for item in order.items.select_related('product'):
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.return_stock(item.quantity)
                
                order.payment_status = new_payment_status
                order.save()
        else:
            order.payment_status = new_payment_status
    
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
    """Get order statistics for admin dashboard."""
    from decimal import Decimal
    
    total_orders = Order.objects.count()
    
    orders_by_status = Order.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    orders_by_payment_status = Order.objects.values('payment_status').annotate(
        count=Count('id')
    ).order_by('payment_status')
    
    total_revenue = Order.objects.filter(
        payment_status='paid'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    recent_orders_data = AdminOrderSerializer(recent_orders, many=True).data
    
    return Response({
        'total_orders': total_orders,
        'orders_by_status': list(orders_by_status),
        'orders_by_payment_status': list(orders_by_payment_status),
        'total_revenue': float(total_revenue),
        'recent_orders': recent_orders_data
    })