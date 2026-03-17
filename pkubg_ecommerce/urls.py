"""
URL configuration for pkubg_ecommerce project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import logging
from .address_suggestions import get_address_suggestions

logger = logging.getLogger(__name__)

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
            'monitoring': '/monitoring/',
        },
        'documentation': 'https://github.com/your-repo/docs'
    })

@csrf_exempt
@require_POST
def csp_report(request):
    """
    Endpoint для приема отчетов о нарушениях Content Security Policy.
    Логирует нарушения для анализа и улучшения политики безопасности.
    """
    try:
        report = json.loads(request.body.decode('utf-8'))
        csp_report = report.get('csp-report', {})
        
        # Логируем нарушение CSP
        logger.warning(
            f"CSP Violation: "
            f"document-uri={csp_report.get('document-uri')}, "
            f"blocked-uri={csp_report.get('blocked-uri')}, "
            f"violated-directive={csp_report.get('violated-directive')}, "
            f"original-policy={csp_report.get('original-policy')}"
        )
        
        return JsonResponse({'status': 'ok'}, status=204)
    except Exception as e:
        logger.error(f"Error processing CSP report: {e}")
        return JsonResponse({'status': 'error'}, status=400)

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/articles/', include('articles.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/address-suggestions/', get_address_suggestions, name='address_suggestions'),
    path('api/csp-report/', csp_report, name='csp_report'),
    path('monitoring/', include('monitoring.urls')),
    path('api/legal-info/', include('legal.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)