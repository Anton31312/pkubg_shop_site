"""
URL patterns for integrations app.
"""
from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    # Payment endpoints
    path('payment/create/', views.create_payment, name='create_payment'),
    path('payment/status/<str:payment_id>/', views.payment_status, name='payment_status'),
    path('webhooks/yookassa/', views.yookassa_webhook, name='yookassa_webhook'),
    
    # Delivery endpoints
    path('delivery/calculate-cost/', views.calculate_delivery_cost, name='calculate_delivery_cost'),
    path('delivery/pickup-points/', views.find_pickup_points, name='find_pickup_points'),
    path('delivery/create/', views.create_delivery_order, name='create_delivery_order'),
    path('delivery/status/<int:delivery_id>/', views.delivery_status, name='delivery_status'),
    path('webhooks/cdek/', views.cdek_webhook, name='cdek_webhook'),
]