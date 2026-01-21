"""
Health check endpoints for monitoring system availability
"""
import time
import psutil
import logging
from django.http import JsonResponse
from django.views import View
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class HealthCheckView(View):
    """Basic health check endpoint"""
    
    def get(self, request):
        """Return basic health status"""
        try:
            # Check database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            # Check cache
            cache_key = 'health_check_test'
            cache.set(cache_key, 'ok', 30)
            cache_status = cache.get(cache_key) == 'ok'
            
            return JsonResponse({
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'database': 'ok',
                'cache': 'ok' if cache_status else 'error',
                'version': getattr(settings, 'VERSION', '1.0.0')
            })
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return JsonResponse({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'error': str(e)
            }, status=503)


class DetailedHealthCheckView(View):
    """Detailed health check with system metrics"""
    
    def get(self, request):
        """Return detailed health status with system metrics"""
        start_time = time.time()
        
        try:
            # Database check
            db_status = self._check_database()
            
            # Cache check
            cache_status = self._check_cache()
            
            # System metrics
            system_metrics = self._get_system_metrics()
            
            # Response time
            response_time = (time.time() - start_time) * 1000  # ms
            
            # Overall status
            overall_status = 'healthy'
            if not db_status['healthy'] or not cache_status['healthy']:
                overall_status = 'degraded'
            
            if system_metrics['cpu_percent'] > 90 or system_metrics['memory_percent'] > 90:
                overall_status = 'degraded'
            
            return JsonResponse({
                'status': overall_status,
                'timestamp': timezone.now().isoformat(),
                'response_time_ms': round(response_time, 2),
                'database': db_status,
                'cache': cache_status,
                'system': system_metrics,
                'version': getattr(settings, 'VERSION', '1.0.0')
            })
            
        except Exception as e:
            logger.error(f"Detailed health check failed: {str(e)}")
            return JsonResponse({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
                'response_time_ms': round((time.time() - start_time) * 1000, 2)
            }, status=503)
    
    def _check_database(self):
        """Check database connectivity and performance"""
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                result = cursor.fetchone()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'healthy': True,
                'response_time_ms': round(response_time, 2),
                'migrations_count': result[0] if result else 0
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e)
            }
    
    def _check_cache(self):
        """Check cache connectivity and performance"""
        try:
            start_time = time.time()
            cache_key = 'health_check_detailed'
            test_value = f'test_{int(time.time())}'
            
            cache.set(cache_key, test_value, 30)
            retrieved_value = cache.get(cache_key)
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'healthy': retrieved_value == test_value,
                'response_time_ms': round(response_time, 2)
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e)
            }
    
    def _get_system_metrics(self):
        """Get system resource usage metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Load average (Unix only)
            try:
                load_avg = psutil.getloadavg()
                load_avg_1min = load_avg[0]
            except (AttributeError, OSError):
                load_avg_1min = None
            
            return {
                'cpu_percent': round(cpu_percent, 2),
                'memory_percent': round(memory.percent, 2),
                'memory_available_mb': round(memory.available / 1024 / 1024, 2),
                'disk_percent': round(disk.percent, 2),
                'disk_free_gb': round(disk.free / 1024 / 1024 / 1024, 2),
                'load_avg_1min': round(load_avg_1min, 2) if load_avg_1min else None
            }
        except Exception as e:
            logger.error(f"Failed to get system metrics: {str(e)}")
            return {
                'error': str(e)
            }


class ReadinessCheckView(View):
    """Readiness check for Kubernetes/Docker deployments"""
    
    def get(self, request):
        """Check if application is ready to serve traffic"""
        try:
            # Check critical dependencies
            checks = {
                'database': self._check_database_ready(),
                'migrations': self._check_migrations(),
            }
            
            # All checks must pass
            all_ready = all(check['ready'] for check in checks.values())
            
            return JsonResponse({
                'ready': all_ready,
                'timestamp': timezone.now().isoformat(),
                'checks': checks
            }, status=200 if all_ready else 503)
            
        except Exception as e:
            logger.error(f"Readiness check failed: {str(e)}")
            return JsonResponse({
                'ready': False,
                'timestamp': timezone.now().isoformat(),
                'error': str(e)
            }, status=503)
    
    def _check_database_ready(self):
        """Check if database is ready"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return {'ready': True}
        except Exception as e:
            return {'ready': False, 'error': str(e)}
    
    def _check_migrations(self):
        """Check if all migrations are applied"""
        try:
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            return {
                'ready': len(plan) == 0,
                'pending_migrations': len(plan)
            }
        except Exception as e:
            return {'ready': False, 'error': str(e)}