"""
Serializers for products API.
"""
from rest_framework import serializers
from .models import Product, Category, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 'is_active']
        read_only_fields = ['id']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    
    images = ProductImageSerializer(many=True, read_only=True)
    category_detail = CategorySerializer(source='category', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'category', 'category_detail',
            'manufacturer', 'composition', 'storage_conditions',
            'is_gluten_free', 'is_low_protein', 'nutritional_info', 'stock_quantity',
            'is_active', 'created_at', 'updated_at', 'images'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_category(self, value):
        """Validate category exists."""
        if isinstance(value, int):
            if not Category.objects.filter(id=value).exists():
                raise serializers.ValidationError("Category does not exist.")
            return value
        elif hasattr(value, 'id'):
            return value.id
        else:
            raise serializers.ValidationError("Invalid category format.")
    
    def create(self, validated_data):
        """Create product with proper category handling."""
        category_id = validated_data.get('category')
        if isinstance(category_id, int):
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category': 'Category does not exist.'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update product with proper category handling."""
        category_id = validated_data.get('category')
        if category_id and isinstance(category_id, int):
            try:
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category': 'Category does not exist.'})
        return super().update(instance, validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product list views."""
    
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'category',
            'manufacturer', 'composition', 'storage_conditions',
            'is_gluten_free', 'is_low_protein', 'stock_quantity',
            'is_active', 'created_at', 'updated_at', 'images'
        ]