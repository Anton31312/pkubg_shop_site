"""
Application metrics collection and monitoring
"""
import time
import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.db import models
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collect and store application metrics"""
    
    def __init__(self):
        self.cache_prefix = 'metrics:'
        self.cache_timeout = 300  # 5 minutes
    
    def record_api_request(self, endpoint, method, status_code, response_time_ms):
        """Record API request metrics"""
        timestamp = timezone.now()
        minute_key = timestamp.strftime('%Y-%m-%d-%H-%M')
        
        # Store in cache for real-time monitoring
        cache_key = f"{self.cache_prefix}api:{minute_key}"
        
        try:
            current_data = cache.get(cache_key, {
                'requests': 0,
                'total_response_time': 0,
                'status_codes': {},
                'endpoints': {}
            })
            
            current_data['requests'] += 1
            current_data['total_response_time'] += response_time_ms
            
            # Track status codes
            status_str = str(status_code)
            current_data['status_codes'][status_str] = current_data['status_codes'].get(status_str, 0) + 1
            
            # Track endpoints
            current_data['endpoints'][endpoint] = current_data['endpoints'].get(endpoint, 0) + 1
            
            cache.set(cache_key, current_data, self.cache_timeout)
            
        except Exception as e:
            logger.error(f"Failed to record API metrics: {str(e)}")
    
    def record_error(self, error_type, error_message, endpoint=None):
        """Record application errors"""
        timestamp = timezone.now()
        minute_key = timestamp.strftime('%Y-%m-%d-%H-%M')
        
        cache_key = f"{self.cache_prefix}errors:{minute_key}"
        
        try:
            current_data = cache.get(cache_key, {
                'total_errors': 0,
                'error_types': {},
                'endpoints': {}
            })
            
            current_data['total_errors'] += 1
            current_data['error_types'][error_type] = current_data['error_types'].get(error_type, 0) + 1
            
            if endpoint:
                current_data['endpoints'][endpoint] = current_data['endpoints'].get(endpoint, 0) + 1
            
            cache.set(cache_key, current_data, self.cache_timeout)
            
        except Exception as e:
            logger.error(f"Failed to record error metrics: {str(e)}")
    
    def get_api_metrics(self, minutes=60):
        """Get API metrics for the last N minutes"""
        now = timezone.now()
        metrics = {
            'total_requests': 0,
            'avg_response_time': 0,
            'status_codes': {},
            'endpoints': {},
            'requests_per_minute': []
        }
        
        total_response_time = 0
        
        for i in range(minutes):
            timestamp = now - timedelta(minutes=i)
            minute_key = timestamp.strftime('%Y-%m-%d-%H-%M')
            cache_key = f"{self.cache_prefix}api:{minute_key}"
            
            minute_data = cache.get(cache_key, {})
            
            if minute_data:
                requests = minute_data.get('requests', 0)
                metrics['total_requests'] += requests
                total_response_time += minute_data.get('total_response_time', 0)
                
                # Aggregate status codes
                for status, count in minute_data.get('status_codes', {}).items():
                    metrics['status_codes'][status] = metrics['status_codes'].get(status, 0) + count
                
                # Aggregate endpoints
                for endpoint, count in minute_data.get('endpoints', {}).items():
                    metrics['endpoints'][endpoint] = metrics['endpoints'].get(endpoint, 0) + count
                
                metrics['requests_per_minute'].append({
                    'timestamp': timestamp.isoformat(),
                    'requests': requests
                })
        
        # Calculate average response time
        if metrics['total_requests'] > 0:
            metrics['avg_response_time'] = round(total_response_time / metrics['total_requests'], 2)
        
        return metrics
    
    def get_error_metrics(self, minutes=60):
        """Get error metrics for the last N minutes"""
        now = timezone.now()
        metrics = {
            'total_errors': 0,
            'error_types': {},
            'endpoints': {},
            'errors_per_minute': []
        }
        
        for i in range(minutes):
            timestamp = now - timedelta(minutes=i)
            minute_key = timestamp.strftime('%Y-%m-%d-%H-%M')
            cache_key = f"{self.cache_prefix}errors:{minute_key}"
            
            minute_data = cache.get(cache_key, {})
            
            if minute_data:
                errors = minute_data.get('total_errors', 0)
                metrics['total_errors'] += errors
                
                # Aggregate error types
                for error_type, count in minute_data.get('error_types', {}).items():
                    metrics['error_types'][error_type] = metrics['error_types'].get(error_type, 0) + count
                
                # Aggregate endpoints
                for endpoint, count in minute_data.get('endpoints', {}).items():
                    metrics['endpoints'][endpoint] = metrics['endpoints'].get(endpoint, 0) + count
                
                metrics['errors_per_minute'].append({
                    'timestamp': timestamp.isoformat(),
                    'errors': errors
                })
        
        return metrics


# Global metrics collector instance
metrics_collector = MetricsCollector()


class MetricsMiddleware:
    """Django middleware to collect request metrics"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Record metrics for API endpoints
        if request.path.startswith('/api/'):
            metrics_collector.record_api_request(
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )
        
        return response
    
    def process_exception(self, request, exception):
        """Record exceptions as errors"""
        if request.path.startswith('/api/'):
            metrics_collector.record_error(
                error_type=exception.__class__.__name__,
                error_message=str(exception),
                endpoint=request.path
            )
        
        return None


class AlertManager:
    """Manage monitoring alerts"""
    
    def __init__(self):
        self.alert_thresholds = {
            'error_rate': 0.05,  # 5% error rate
            'response_time': 2000,  # 2 seconds
            'cpu_usage': 80,  # 80%
            'memory_usage': 85,  # 85%
            'disk_usage': 90,  # 90%
        }
    
    def check_alerts(self):
        """Check all alert conditions"""
        alerts = []
        
        # Check API metrics
        api_metrics = metrics_collector.get_api_metrics(minutes=5)
        error_metrics = metrics_collector.get_error_metrics(minutes=5)
        
        # Error rate alert
        if api_metrics['total_requests'] > 0:
            error_rate = error_metrics['total_errors'] / api_metrics['total_requests']
            if error_rate > self.alert_thresholds['error_rate']:
                alerts.append({
                    'type': 'error_rate',
                    'severity': 'warning',
                    'message': f"High error rate: {error_rate:.2%}",
                    'value': error_rate,
                    'threshold': self.alert_thresholds['error_rate']
                })
        
        # Response time alert
        if api_metrics['avg_response_time'] > self.alert_thresholds['response_time']:
            alerts.append({
                'type': 'response_time',
                'severity': 'warning',
                'message': f"High response time: {api_metrics['avg_response_time']}ms",
                'value': api_metrics['avg_response_time'],
                'threshold': self.alert_thresholds['response_time']
            })
        
        return alerts
    
    def send_alert(self, alert):
        """Send alert notification (implement your preferred method)"""
        logger.warning(f"ALERT: {alert['message']}")
        
        # TODO: Implement actual alert sending (email, Slack, etc.)
        # Example implementations:
        # - Send email
        # - Post to Slack webhook
        # - Send to monitoring service (Prometheus, Grafana, etc.)


# Global alert manager instance
alert_manager = AlertManager()