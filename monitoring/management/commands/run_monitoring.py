"""
Management command to run monitoring checks
"""
import time
import logging
from django.core.management.base import BaseCommand
from monitoring.external_monitoring import monitoring_service

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run monitoring health checks and send alerts'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=300,  # 5 minutes
            help='Check interval in seconds (default: 300)'
        )
        
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run once and exit (default: run continuously)'
        )
    
    def handle(self, *args, **options):
        interval = options['interval']
        run_once = options['once']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting monitoring service (interval: {interval}s)')
        )
        
        while True:
            try:
                self.stdout.write('Running health checks...')
                results = monitoring_service.run_health_checks()
                
                # Log results
                up_count = len([r for r in results if r['status'] == 'up'])
                down_count = len([r for r in results if r['status'] == 'down'])
                
                self.stdout.write(
                    f'Health check complete: {up_count} up, {down_count} down'
                )
                
                if down_count > 0:
                    self.stdout.write(
                        self.style.ERROR(f'{down_count} services are down!')
                    )
                
                if run_once:
                    break
                
                self.stdout.write(f'Waiting {interval} seconds...')
                time.sleep(interval)
                
            except KeyboardInterrupt:
                self.stdout.write(
                    self.style.SUCCESS('Monitoring service stopped')
                )
                break
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error in monitoring service: {str(e)}')
                )
                if run_once:
                    break
                time.sleep(interval)