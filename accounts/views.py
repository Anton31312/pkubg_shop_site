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
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.permissions import AllowAny


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

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Запрос на сброс пароля — отправляет email со ссылкой.
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response(
            {'detail': 'Email обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Не раскрываем существует ли email (безопасность)
        return Response(
            {'detail': 'Если этот email зарегистрирован, вы получите письмо с инструкциями.'},
            status=status.HTTP_200_OK
        )
    
    # Генерируем токен
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Формируем ссылку (ПРАВКА)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"
    
    # Отправляем email
    subject = 'Восстановление пароля — PKUBG'
    message = f"""
Здравствуйте, {user.first_name or user.email}!

Вы запросили восстановление пароля для вашего аккаунта.

Перейдите по ссылке для установки нового пароля:
{reset_url}

Ссылка действительна в течение 24 часов.

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

С уважением,
Команда PKUBG
    """.strip()
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c5530;">Восстановление пароля</h2>
            <p>Здравствуйте, <strong>{user.first_name or user.email}</strong>!</p>
            <p>Вы запросили восстановление пароля для вашего аккаунта.</p>
            <p>
                <a href="{reset_url}" 
                   style="display: inline-block; 
                          background: #2c5530; 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 6px;
                          font-weight: bold;">
                    Установить новый пароль
                </a>
            </p>
            <p style="color: #666; font-size: 14px;">
                Ссылка действительна в течение 24 часов.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending password reset email: {e}")
    
    return Response(
        {'detail': 'Если этот email зарегистрирован, вы получите письмо с инструкциями.'},
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Подтверждение сброса пароля — устанавливает новый пароль.
    """
    uid = request.data.get('uid', '')
    token = request.data.get('token', '')
    new_password = request.data.get('new_password', '')
    
    if not uid or not token:
        return Response(
            {'detail': 'Недействительная ссылка для сброса пароля'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not new_password:
        return Response(
            {'detail': 'Новый пароль обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'detail': 'Пароль должен содержать минимум 8 символов'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'detail': 'Недействительная ссылка для сброса пароля'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not default_token_generator.check_token(user, token):
        return Response(
            {'detail': 'Ссылка устарела или уже была использована. Запросите новую.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response(
        {'detail': 'Пароль успешно изменён'},
        status=status.HTTP_200_OK
    )