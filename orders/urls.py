from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # Cart API endpoints
    path('cart/', views.get_cart, name='get_cart'),
    path('cart/add/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/', views.update_cart_item, name='update_cart_item'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    
    # Order API endpoints
    path('orders/', views.get_user_orders, name='get_user_orders'),
    path('orders/create/', views.create_order, name='create_order'),
    
    # Test endpoint
    path('cart/test/', views.test_cart_update, name='test_cart_update'),
]