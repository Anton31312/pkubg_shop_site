"""
Views for accounts app.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.decorators import login_required
from orders.models import Order
from orders.serializers import OrderSerializer
from .serializers import (
    UserSerializer, 
    UserUpdateSerializer, 
    UserRegistrationSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that returns user data along with tokens."""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user data
            from django.contrib.auth import authenticate
            email = request.data.get('email')
            password = request.data.get('password')
            
            user = authenticate(request, username=email, password=password)
            if user:
                user_data = UserSerializer(user).data
                response.data['user'] = user_data
        
        return response


class UserRegistrationView(generics.CreateAPIView):
    """User registration view."""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view for retrieving and updating profile data."""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Return the current user."""
        return self.request.user
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class UserOrderHistoryView(generics.ListAPIView):
    """View for user's order history."""
    
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return orders for the current user."""
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout view that terminates the session."""
    try:
        # For JWT, we don't need to do anything server-side
        # The client should remove the token
        # For session-based auth, we would call logout(request)
        
        # If using session authentication, uncomment the next line:
        # logout(request)
        
        return Response({
            'message': 'Успешный выход из системы',
            'redirect_url': '/'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Ошибка при выходе из системы',
            'detail': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_view(request):
    """Dashboard view with user summary information."""
    user = request.user
    
    # Get user's order statistics
    orders = Order.objects.filter(user=user)
    order_count = orders.count()
    
    # Get recent orders (last 5)
    recent_orders = orders.order_by('-created_at')[:5]
    
    return Response({
        'user': UserSerializer(user).data,
        'statistics': {
            'total_orders': order_count,
            'pending_orders': orders.filter(status='pending').count(),
            'completed_orders': orders.filter(status='delivered').count(),
        },
        'recent_orders': OrderSerializer(recent_orders, many=True).data
    })