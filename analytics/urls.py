from django.urls import path
from . import views

urlpatterns = [
    path('cart-statistics/', views.cart_statistics, name='cart-statistics'),
    path('real-time-cart/', views.real_time_cart_stats, name='real-time-cart'),
    path('dashboard/', views.DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
]