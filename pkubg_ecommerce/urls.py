"""
URL configuration for pkubg_ecommerce project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    """API root endpoint with available endpoints."""
    return JsonResponse({
        'message': 'PKUBG E-commerce API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/auth/',
            'products': '/api/products/',
            'orders': '/api/orders/',
            'articles': '/api/articles/',
            'analytics': '/api/analytics/',
            'integrations': '/api/integrations/',
        },
        'documentation': 'https://github.com/your-repo/docs'
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/articles/', include('articles.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/integrations/', include('integrations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)