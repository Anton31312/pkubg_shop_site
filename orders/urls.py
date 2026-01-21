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
    path('', views.get_user_orders, name='get_user_orders'),
    path('create/', views.create_order, name='create_order'),
    
    # Admin/Manager order management endpoints
    path('admin/all/', views.admin_get_all_orders, name='admin_get_all_orders'),
    path('admin/<int:order_id>/', views.admin_get_order_detail, name='admin_get_order_detail'),
    path('admin/<int:order_id>/update/', views.admin_update_order_status, name='admin_update_order_status'),
    path('admin/statistics/', views.admin_get_order_statistics, name='admin_get_order_statistics'),
    
    # Test endpoint
    path('cart/test/', views.test_cart_update, name='test_cart_update'),
]