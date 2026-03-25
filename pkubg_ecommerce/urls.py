"""
URL configuration for pkubg_ecommerce project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
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


def robots_txt(request):
    """Файл для поисковых роботов."""
    content = """User-agent: *
Allow: /
Allow: /products
Allow: /products/
Allow: /articles
Allow: /articles/
Allow: /about

Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /manage/
Disallow: /orders/manage
Disallow: /products/manage

Sitemap: https://pkubg.ru/sitemap.xml
"""
    return HttpResponse(content.strip(), content_type='text/plain')


def sitemap_xml(request):
    """Карта сайта для поисковиков."""
    from products.models import Product
    
    urls = []

    # Статические страницы
    static_pages = [
        ('https://pkubg.ru/', '1.0', 'daily'),
        ('https://pkubg.ru/products', '0.9', 'daily'),
        ('https://pkubg.ru/articles', '0.7', 'weekly'),
        ('https://pkubg.ru/about', '0.5', 'monthly'),
    ]

    for loc, priority, freq in static_pages:
        urls.append(
            f'  <url>\n'
            f'    <loc>{loc}</loc>\n'
            f'    <changefreq>{freq}</changefreq>\n'
            f'    <priority>{priority}</priority>\n'
            f'  </url>'
        )

    # Все активные товары
    for product in Product.objects.filter(is_active=True):
        urls.append(
            f'  <url>\n'
            f'    <loc>https://pkubg.ru/products/{product.id}</loc>\n'
            f'    <changefreq>weekly</changefreq>\n'
            f'    <priority>0.8</priority>\n'
            f'  </url>'
        )

    # Все опубликованные статьи
    try:
        from articles.models import Article
        for article in Article.objects.filter(is_published=True):
            urls.append(
                f'  <url>\n'
                f'    <loc>https://pkubg.ru/articles/{article.slug}</loc>\n'
                f'    <changefreq>monthly</changefreq>\n'
                f'    <priority>0.6</priority>\n'
                f'  </url>'
            )
    except Exception:
        pass

    xml_content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{chr(10).join(urls)}\n'
        '</urlset>'
    )

    return HttpResponse(xml_content, content_type='application/xml')


@csrf_exempt
@require_POST
def csp_report(request):
    """Endpoint для приема отчетов о нарушениях CSP."""
    try:
        report = json.loads(request.body.decode('utf-8'))
        csp_report_data = report.get('csp-report', {})
        logger.warning(
            f"CSP Violation: "
            f"document-uri={csp_report_data.get('document-uri')}, "
            f"blocked-uri={csp_report_data.get('blocked-uri')}, "
            f"violated-directive={csp_report_data.get('violated-directive')}"
        )
        return JsonResponse({'status': 'ok'}, status=204)
    except Exception as e:
        logger.error(f"Error processing CSP report: {e}")
        return JsonResponse({'status': 'error'}, status=400)


urlpatterns = [
    # SEO — robots и sitemap ПЕРВЫМИ
    path('robots.txt', robots_txt, name='robots_txt'),
    path('sitemap.xml', sitemap_xml, name='sitemap_xml'),

    # API и админка
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