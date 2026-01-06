from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserOrderHistoryView,
    logout_view,
    user_dashboard_view,
)

urlpatterns = [
    # Authentication
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', logout_view, name='logout'),
    
    # Registration
    path('register/', UserRegistrationView.as_view(), name='register'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('dashboard/', user_dashboard_view, name='user_dashboard'),
    
    # Order History
    path('orders/', UserOrderHistoryView.as_view(), name='user_orders'),
]