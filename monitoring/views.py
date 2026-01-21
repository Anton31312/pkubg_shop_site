"""
Monitoring dashboard views
"""
import json
import psutil
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.utils import timezone
from .metrics import metrics_collector, alert_manager
from .health_check import DetailedHealthCheckView


@method_decorator(staff_member_required, name='dispatch')
class MonitoringDashboardView(View):
    """Main monitoring dashboard"""
    
    def get(self, request):
        """Render monitoring dashboard"""
        return render(request, 'monitoring/dashboard.html')


class MetricsAPIView(View):
    """API endpoint for metrics data"""
    
    def get(self, request):
        """Return metrics data as JSON"""
        minutes = int(request.GET.get('minutes', 60))
        
        # Get API metrics
        api_metrics = metrics_collector.get_api_metrics(minutes=minutes)
        error_metrics = metrics_collector.get_error_metrics(minutes=minutes)
        
        # Get system metrics
        system_metrics = self._get_current_system_metrics()
        
        # Check alerts
        alerts = alert_manager.check_alerts()
        
        return JsonResponse({
            'timestamp': timezone.now().isoformat(),
            'api_metrics': api_metrics,
            'error_metrics': error_metrics,
            'system_metrics': system_metrics,
            'alerts': alerts
        })
    
    def _get_current_system_metrics(self):
        """Get current system metrics"""
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent,
                'timestamp': timezone.now().isoformat()
            }
        except Exception:
            return {}


class PrometheusMetricsView(View):
    """Prometheus-compatible metrics endpoint"""
    
    def get(self, request):
        """Return metrics in Prometheus format"""
        metrics_lines = []
        
        # Get current metrics
        api_metrics = metrics_collector.get_api_metrics(minutes=5)
        error_metrics = metrics_collector.get_error_metrics(minutes=5)
        
        # API request metrics
        metrics_lines.append('# HELP http_requests_total Total number of HTTP requests')
        metrics_lines.append('# TYPE http_requests_total counter')
        metrics_lines.append(f'http_requests_total {api_metrics["total_requests"]}')
        
        # Response time metrics
        metrics_lines.append('# HELP http_request_duration_milliseconds Average HTTP request duration')
        metrics_lines.append('# TYPE http_request_duration_milliseconds gauge')
        metrics_lines.append(f'http_request_duration_milliseconds {api_metrics["avg_response_time"]}')
        
        # Error metrics
        metrics_lines.append('# HELP http_errors_total Total number of HTTP errors')
        metrics_lines.append('# TYPE http_errors_total counter')
        metrics_lines.append(f'http_errors_total {error_metrics["total_errors"]}')
        
        # Status code metrics
        for status_code, count in api_metrics['status_codes'].items():
            metrics_lines.append(f'http_requests_total{{status="{status_code}"}} {count}')
        
        # System metrics
        try:
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            disk_percent = psutil.disk_usage('/').percent
            
            metrics_lines.append('# HELP system_cpu_usage_percent CPU usage percentage')
            metrics_lines.append('# TYPE system_cpu_usage_percent gauge')
            metrics_lines.append(f'system_cpu_usage_percent {cpu_percent}')
            
            metrics_lines.append('# HELP system_memory_usage_percent Memory usage percentage')
            metrics_lines.append('# TYPE system_memory_usage_percent gauge')
            metrics_lines.append(f'system_memory_usage_percent {memory_percent}')
            
            metrics_lines.append('# HELP system_disk_usage_percent Disk usage percentage')
            metrics_lines.append('# TYPE system_disk_usage_percent gauge')
            metrics_lines.append(f'system_disk_usage_percent {disk_percent}')
            
        except Exception:
            pass
        
        return JsonResponse(
            '\n'.join(metrics_lines),
            content_type='text/plain; version=0.0.4; charset=utf-8',
            safe=False
        )


class UptimeView(View):
    """Simple uptime check endpoint"""
    
    def get(self, request):
        """Return uptime status"""
        try:
            import uptime
            uptime_seconds = uptime.uptime()
        except ImportError:
            # Fallback if uptime module not available
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
        except Exception:
            uptime_seconds = None
        
        return JsonResponse({
            'status': 'up',
            'uptime_seconds': uptime_seconds,
            'timestamp': timezone.now().isoformat()
        })


class LogsView(View):
    """View recent application logs"""
    
    def get(self, request):
        """Return recent log entries"""
        lines = int(request.GET.get('lines', 100))
        level = request.GET.get('level', 'INFO')
        
        try:
            import os
            from django.conf import settings
            
            log_file = os.path.join(settings.BASE_DIR, 'logs', 'django.log')
            
            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    log_lines = f.readlines()
                
                # Get last N lines
                recent_lines = log_lines[-lines:] if len(log_lines) > lines else log_lines
                
                # Filter by log level if specified
                if level != 'ALL':
                    recent_lines = [line for line in recent_lines if level in line]
                
                return JsonResponse({
                    'logs': recent_lines,
                    'total_lines': len(recent_lines),
                    'timestamp': timezone.now().isoformat()
                })
            else:
                return JsonResponse({
                    'logs': [],
                    'error': 'Log file not found',
                    'timestamp': timezone.now().isoformat()
                })
                
        except Exception as e:
            return JsonResponse({
                'logs': [],
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=500)