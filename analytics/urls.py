from django.urls import path
from . import views

urlpatterns = [
    path('cart-statistics/', views.cart_statistics, name='cart_statistics'),
    path('real-time-cart-stats/', views.real_time_cart_stats, name='real_time_cart_stats'),
]