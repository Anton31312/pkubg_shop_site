"""
Filters for products API.
"""
import django_filters
from django.db import models
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    """Filter for Product model with search and category filtering."""
    
    # Search by name and description
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Category filtering (supports multiple categories separated by comma)
    category = django_filters.CharFilter(method='filter_category', label='Category')
    
    # Dietary filters
    is_gluten_free = django_filters.BooleanFilter(label='Gluten Free')
    is_low_protein = django_filters.BooleanFilter(label='Low Protein')
    
    # Price range filtering
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte', label='Min Price')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte', label='Max Price')
    
    # Manufacturer filtering (supports multiple manufacturers separated by comma)
    manufacturer = django_filters.CharFilter(method='filter_manufacturer', label='Manufacturer')
    
    # Stock availability
    in_stock = django_filters.BooleanFilter(method='filter_in_stock', label='In Stock')
    
    class Meta:
        model = Product
        fields = ['category', 'is_gluten_free', 'is_low_protein', 'is_active', 'manufacturer']
    
    def filter_search(self, queryset, name, value):
        """Filter products by search term in name or description."""
        if value:
            return queryset.filter(
                models.Q(name__icontains=value) | 
                models.Q(description__icontains=value)
            )
        return queryset
    
    def filter_category(self, queryset, name, value):
        """Filter products by category(ies). Supports comma-separated values."""
        if value:
            category_ids = [int(c.strip()) for c in value.split(',') if c.strip().isdigit()]
            return queryset.filter(category_id__in=category_ids)
        return queryset
    
    def filter_manufacturer(self, queryset, name, value):
        """Filter products by manufacturer(s). Supports comma-separated values."""
        if value:
            manufacturers = [m.strip() for m in value.split(',')]
            return queryset.filter(manufacturer__in=manufacturers)
        return queryset
    
    def filter_in_stock(self, queryset, name, value):
        """Filter products by stock availability."""
        if value is True:
            return queryset.filter(stock_quantity__gt=0)
        elif value is False:
            return queryset.filter(stock_quantity=0)
        return queryset