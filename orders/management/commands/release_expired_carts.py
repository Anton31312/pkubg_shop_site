from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from orders.models import Cart, CartItem
from products.models import Product


class Command(BaseCommand):
    help = 'Снимает резерв с товаров в корзинах, не обновлявшихся более 24 часов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Через сколько часов считать корзину брошенной (по умолчанию 24)',
        )

    def handle(self, *args, **options):
        hours = options['hours']
        threshold = timezone.now() - timedelta(hours=hours)
        
        # Находим корзины, не обновлявшиеся дольше threshold
        expired_carts = Cart.objects.filter(
            updated_at__lt=threshold,
            items__isnull=False
        ).distinct()
        
        total_released = 0
        
        for cart in expired_carts:
            with transaction.atomic():
                for item in cart.items.select_related('product'):
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.release_reserve(item.quantity)
                    total_released += item.quantity
                
                # Очищаем корзину
                cart.items.all().delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Обработано корзин: {expired_carts.count()}, '
                f'снято с резерва позиций: {total_released}'
            )
        )