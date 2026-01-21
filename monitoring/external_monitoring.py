"""
External monitoring integrations (Prometheus, Grafana, Uptime monitoring)
"""
import requests
import json
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class UptimeMonitor:
    """Simple uptime monitoring service"""
    
    def __init__(self, urls_to_monitor=None):
        self.urls_to_monitor = urls_to_monitor or [
            'https://pkubg.ru',
            'https://pkubg.ru/api/',
            'https://pkubg.ru/monitoring/health/',
        ]
    
    def check_url(self, url, timeout=10):
        """Check if URL is accessible"""
        try:
            start_time = datetime.now()
            response = requests.get(url, timeout=timeout)
            end_time = datetime.now()
            
            response_time = (end_time - start_time).total_seconds() * 1000
            
            return {
                'url': url,
                'status': 'up' if response.status_code == 200 else 'down',
                'status_code': response.status_code,
                'response_time_ms': round(response_time, 2),
                'timestamp': datetime.now().isoformat(),
                'error': None
            }
        except requests.exceptions.RequestException as e:
            return {
                'url': url,
                'status': 'down',
                'status_code': None,
                'response_time_ms': None,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def check_all_urls(self):
        """Check all monitored URLs"""
        results = []
        for url in self.urls_to_monitor:
            result = self.check_url(url)
            results.append(result)
            
            # Log if service is down
            if result['status'] == 'down':
                logger.error(f"Service down: {url} - {result['error']}")
        
        return results


class PrometheusExporter:
    """Export metrics to Prometheus format"""
    
    def __init__(self):
        self.metrics = {}
    
    def add_metric(self, name, value, labels=None, help_text="", metric_type="gauge"):
        """Add a metric for export"""
        self.metrics[name] = {
            'value': value,
            'labels': labels or {},
            'help': help_text,
            'type': metric_type
        }
    
    def export_metrics(self):
        """Export all metrics in Prometheus format"""
        output = []
        
        for name, metric in self.metrics.items():
            # Add help and type comments
            output.append(f"# HELP {name} {metric['help']}")
            output.append(f"# TYPE {name} {metric['type']}")
            
            # Add metric with labels
            if metric['labels']:
                labels_str = ','.join([f'{k}="{v}"' for k, v in metric['labels'].items()])
                output.append(f"{name}{{{labels_str}}} {metric['value']}")
            else:
                output.append(f"{name} {metric['value']}")
            
            output.append("")  # Empty line between metrics
        
        return '\n'.join(output)


class SlackNotifier:
    """Send notifications to Slack"""
    
    def __init__(self, webhook_url=None):
        self.webhook_url = webhook_url or getattr(settings, 'SLACK_WEBHOOK_URL', None)
    
    def send_alert(self, message, severity='warning'):
        """Send alert to Slack"""
        if not self.webhook_url:
            logger.warning("Slack webhook URL not configured")
            return False
        
        color_map = {
            'info': '#36a64f',      # Green
            'warning': '#ff9500',   # Orange
            'error': '#ff0000',     # Red
            'critical': '#8B0000'   # Dark Red
        }
        
        payload = {
            'attachments': [{
                'color': color_map.get(severity, '#ff9500'),
                'title': f'🚨 Pkubg Monitoring Alert - {severity.upper()}',
                'text': message,
                'timestamp': datetime.now().timestamp(),
                'footer': 'Pkubg Monitoring System',
                'fields': [
                    {
                        'title': 'Severity',
                        'value': severity.upper(),
                        'short': True
                    },
                    {
                        'title': 'Time',
                        'value': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'short': True
                    }
                ]
            }]
        }
        
        try:
            response = requests.post(
                self.webhook_url,
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")
            return False


class EmailNotifier:
    """Send email notifications"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pkubg.ru')
        self.admin_emails = getattr(settings, 'ADMIN_EMAILS', ['admin@pkubg.ru'])
    
    def send_alert(self, subject, message, severity='warning'):
        """Send alert email"""
        try:
            from django.core.mail import send_mail
            
            full_message = f"""
Уровень: {severity.upper()}
Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Сообщение:
{message}

---
Система мониторинга Pkubg E-commerce
https://pkubg.ru/monitoring/
            """
            
            send_mail(
                subject=f'[Pkubg Alert] {subject}',
                message=full_message,
                from_email=self.from_email,
                recipient_list=self.admin_emails,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")
            return False


class MonitoringService:
    """Main monitoring service that coordinates all monitoring activities"""
    
    def __init__(self):
        self.uptime_monitor = UptimeMonitor()
        self.slack_notifier = SlackNotifier()
        self.email_notifier = EmailNotifier()
        self.prometheus_exporter = PrometheusExporter()
    
    def run_health_checks(self):
        """Run all health checks and send alerts if needed"""
        results = self.uptime_monitor.check_all_urls()
        
        # Check for down services
        down_services = [r for r in results if r['status'] == 'down']
        
        if down_services:
            for service in down_services:
                message = f"Service {service['url']} is down: {service['error']}"
                
                # Send notifications
                self.slack_notifier.send_alert(message, 'error')
                self.email_notifier.send_alert(
                    f"Service Down: {service['url']}", 
                    message, 
                    'error'
                )
        
        return results
    
    def export_prometheus_metrics(self):
        """Export current metrics for Prometheus"""
        from .metrics import metrics_collector
        
        # Get current metrics
        api_metrics = metrics_collector.get_api_metrics(minutes=5)
        error_metrics = metrics_collector.get_error_metrics(minutes=5)
        
        # Add to Prometheus exporter
        self.prometheus_exporter.add_metric(
            'http_requests_total',
            api_metrics['total_requests'],
            help_text='Total number of HTTP requests'
        )
        
        self.prometheus_exporter.add_metric(
            'http_request_duration_milliseconds',
            api_metrics['avg_response_time'],
            help_text='Average HTTP request duration in milliseconds'
        )
        
        self.prometheus_exporter.add_metric(
            'http_errors_total',
            error_metrics['total_errors'],
            help_text='Total number of HTTP errors'
        )
        
        # Add system metrics
        try:
            import psutil
            self.prometheus_exporter.add_metric(
                'system_cpu_usage_percent',
                psutil.cpu_percent(),
                help_text='CPU usage percentage'
            )
            
            self.prometheus_exporter.add_metric(
                'system_memory_usage_percent',
                psutil.virtual_memory().percent,
                help_text='Memory usage percentage'
            )
            
            self.prometheus_exporter.add_metric(
                'system_disk_usage_percent',
                psutil.disk_usage('/').percent,
                help_text='Disk usage percentage'
            )
        except Exception as e:
            logger.error(f"Failed to get system metrics: {str(e)}")
        
        return self.prometheus_exporter.export_metrics()


# Global monitoring service instance
monitoring_service = MonitoringService()