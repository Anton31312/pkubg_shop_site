"""
URL patterns for integrations app - Robokassa payment integration.
"""
from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    # Payment endpoints
    path('payment/create/', views.create_payment, name='create_payment'),
    path('payment/status/<str:payment_id>/', views.payment_status, name='payment_status'),
    
    # Robokassa webhooks
    path('webhooks/robokassa/', views.robokassa_webhook, name='robokassa_webhook'),
    path('webhooks/robokassa/result-url2/', views.robokassa_result_url2, name='robokassa_result_url2'),
]
