"""
Monitoring URLs configuration
"""
from django.urls import path
from .views import (
    MonitoringDashboardView,
    MetricsAPIView,
    PrometheusMetricsView,
    UptimeView,
    LogsView
)
from .health_check import (
    HealthCheckView,
    DetailedHealthCheckView,
    ReadinessCheckView
)

app_name = 'monitoring'

urlpatterns = [
    # Dashboard
    path('', MonitoringDashboardView.as_view(), name='dashboard'),
    
    # Health checks
    path('health/', HealthCheckView.as_view(), name='health'),
    path('health/detailed/', DetailedHealthCheckView.as_view(), name='health_detailed'),
    path('ready/', ReadinessCheckView.as_view(), name='readiness'),
    
    # Metrics
    path('metrics/', MetricsAPIView.as_view(), name='metrics'),
    path('metrics/prometheus/', PrometheusMetricsView.as_view(), name='prometheus_metrics'),
    
    # System info
    path('uptime/', UptimeView.as_view(), name='uptime'),
    path('logs/', LogsView.as_view(), name='logs'),
]