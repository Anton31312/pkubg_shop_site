"""
Analytics views for cart statistics and dashboard.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from orders.models import Cart, CartItem, Order, OrderItem
from products.models import Product, Category
from django.contrib.auth import get_user_model

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cart_statistics(request):
    active_carts = Cart.objects.filter(items__isnull=False).distinct()
    total_items = CartItem.objects.aggregate(total=Sum('quantity'))['total'] or 0
    total_value = sum(cart.total_amount for cart in active_carts)
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
    return cart_statistics(request)


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        prev_month_start = today - timedelta(days=60)
        prev_month_end = today - timedelta(days=30)

        # ═══ ЗАКАЗЫ ═══
        all_orders = Order.objects.all()
        orders_today = all_orders.filter(created_at__date=today).count()
        orders_week = all_orders.filter(created_at__date__gte=week_ago).count()
        orders_month = all_orders.filter(created_at__date__gte=month_ago).count()
        orders_total = all_orders.count()

        # Выручка (только оплаченные)
        paid_orders = all_orders.filter(payment_status='paid')

        revenue_month = float(
            paid_orders.filter(created_at__date__gte=month_ago)
            .aggregate(total=Sum('total_amount'))['total'] or 0
        )

        revenue_prev_month = float(
            paid_orders.filter(
                created_at__date__gte=prev_month_start,
                created_at__date__lt=prev_month_end
            ).aggregate(total=Sum('total_amount'))['total'] or 0
        )

        revenue_total = float(
            paid_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        )

        avg_order = float(
            paid_orders.aggregate(avg=Avg('total_amount'))['avg'] or 0
        )

        # Выручка по дням
        revenue_by_day = []
        raw_revenue = (
            paid_orders
            .filter(created_at__date__gte=month_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('date')
        )
        for item in raw_revenue:
            revenue_by_day.append({
                'date': item['date'].isoformat(),
                'revenue': float(item['revenue']),
                'count': item['count'],
            })

        # Заказы по статусам
        orders_by_status = {}
        for entry in all_orders.values('status').annotate(cnt=Count('id')):
            orders_by_status[entry['status']] = entry['cnt']

        # Заказы по статусу оплаты
        orders_by_payment = {}
        for entry in all_orders.values('payment_status').annotate(cnt=Count('id')):
            orders_by_payment[entry['payment_status']] = entry['cnt']

        # ═══ ТОП ТОВАРОВ ═══
        top_products = []
        raw_top = (
            OrderItem.objects
            .values('product__id', 'product__name')
            .annotate(
                total_sold=Sum('quantity'),
                total_revenue=Sum(F('quantity') * F('price'))
            )
            .order_by('-total_sold')[:10]
        )
        for p in raw_top:
            top_products.append({
                'product__id': p['product__id'],
                'product__name': p['product__name'],
                'total_sold': p['total_sold'],
                'total_revenue': float(p['total_revenue'] or 0),
            })

        # ═══ ТОВАРЫ ═══
        products = Product.objects.all()
        products_total = products.count()
        products_active = products.filter(is_active=True).count()
        products_out_of_stock = products.filter(stock_quantity=0).count()
        products_low_stock = products.filter(stock_quantity__gt=0, stock_quantity__lt=10).count()

        low_stock_list = []
        for p in products.filter(stock_quantity__gt=0, stock_quantity__lt=10).order_by('stock_quantity')[:10]:
            low_stock_list.append({
                'id': p.id,
                'name': p.name,
                'stock_quantity': p.stock_quantity,
                'price': float(p.price),
            })

        out_of_stock_list = []
        for p in products.filter(stock_quantity=0)[:10]:
            out_of_stock_list.append({
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
            })

        # Товары по категориям
        products_by_category = []
        for cat in Category.objects.annotate(product_count=Count('product')).order_by('-product_count'):
            products_by_category.append({
                'id': cat.id,
                'name': cat.name,
                'product_count': cat.product_count,
            })

        # ═══ ПОЛЬЗОВАТЕЛИ ═══
        users = User.objects.all()
        total_users = users.count()
        new_users_month = users.filter(date_joined__date__gte=month_ago).count()
        new_users_week = users.filter(date_joined__date__gte=week_ago).count()
        users_with_orders = all_orders.values('user').distinct().count()
        conversion_rate = round((users_with_orders / total_users * 100), 1) if total_users > 0 else 0

        # ═══ ПОСЛЕДНИЕ ЗАКАЗЫ ═══
        recent_orders = []
        for order in all_orders.select_related('user').order_by('-created_at')[:10]:
            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
                'user__first_name': order.user.first_name if order.user else '',
                'user__last_name': order.user.last_name if order.user else '',
                'user__email': order.user.email if order.user else '',
            })

        # Рост выручки
        revenue_growth = 0
        if revenue_prev_month > 0:
            revenue_growth = round(
                ((revenue_month - revenue_prev_month) / revenue_prev_month) * 100, 1
            )

        # ═══ КОРЗИНЫ ═══
        active_carts = Cart.objects.filter(items__isnull=False).distinct()
        cart_total_items = CartItem.objects.aggregate(total=Sum('quantity'))['total'] or 0
        cart_total_value = float(sum(cart.total_amount for cart in active_carts))

        return Response({
            'orders': {
                'total': orders_total,
                'today': orders_today,
                'week': orders_week,
                'month': orders_month,
                'by_status': orders_by_status,
                'by_payment': orders_by_payment,
            },
            'revenue': {
                'total': revenue_total,
                'month': revenue_month,
                'prev_month': revenue_prev_month,
                'growth_percent': revenue_growth,
                'average_order': round(avg_order, 2),
                'by_day': revenue_by_day,
            },
            'products': {
                'total': products_total,
                'active': products_active,
                'out_of_stock': products_out_of_stock,
                'low_stock': products_low_stock,
                'categories_count': Category.objects.count(),
                'low_stock_list': low_stock_list,
                'out_of_stock_list': out_of_stock_list,
                'by_category': products_by_category,
            },
            'top_products': top_products,
            'users': {
                'total': total_users,
                'new_week': new_users_week,
                'new_month': new_users_month,
                'with_orders': users_with_orders,
                'conversion_rate': conversion_rate,
            },
            'carts': {
                'total_carts': active_carts.count(),
                'total_items': cart_total_items,
                'total_value': cart_total_value,
            },
            'recent_orders': recent_orders,
        })