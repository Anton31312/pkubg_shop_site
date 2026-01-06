from django.core.management.base import BaseCommand
from products.models import Product, get_default_nutritional_info


class Command(BaseCommand):
    help = 'Update existing products with new nutritional info template'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update even if nutritional_info is not empty',
        )

    def handle(self, *args, **options):
        force = options['force']
        updated_count = 0
        
        products = Product.objects.all()
        
        for product in products:
            # Update if nutritional_info is empty or force is True
            if not product.nutritional_info or force:
                product.nutritional_info = get_default_nutritional_info()
                product.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Updated nutritional info for: {product.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Skipped (already has data): {product.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} products')
        )