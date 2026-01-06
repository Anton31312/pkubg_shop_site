"""
Serializers for articles app.
"""
from rest_framework import serializers
from .models import Article, ArticleCategory, ArticleTag


class ArticleCategorySerializer(serializers.ModelSerializer):
    """Serializer for article categories."""
    
    class Meta:
        model = ArticleCategory
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id']


class ArticleTagSerializer(serializers.ModelSerializer):
    """Serializer for article tags."""
    
    class Meta:
        model = ArticleTag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id']


class ArticleListSerializer(serializers.ModelSerializer):
    """Serializer for article list view."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = ArticleTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'author_name', 
            'category_name', 'tags', 'featured_image', 
            'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for article detail view."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    category = ArticleCategorySerializer(read_only=True)
    tags = ArticleTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 
            'author', 'author_name', 'category', 'tags', 
            'featured_image', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating articles."""
    
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Article
        fields = [
            'title', 'slug', 'content', 'excerpt', 
            'category_id', 'tag_ids', 'featured_image', 'is_published'
        ]
    
    def validate_slug(self, value):
        """Validate that slug is unique."""
        instance = getattr(self, 'instance', None)
        if instance and instance.slug == value:
            return value
        
        if Article.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Article with this slug already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new article."""
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Set author to current user
        validated_data['author'] = self.context['request'].user
        
        # Set category if provided
        if category_id:
            try:
                category = ArticleCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except ArticleCategory.DoesNotExist:
                raise serializers.ValidationError("Invalid category ID.")
        
        article = Article.objects.create(**validated_data)
        
        # Set tags if provided
        if tag_ids:
            tags = ArticleTag.objects.filter(id__in=tag_ids)
            article.tags.set(tags)
        
        return article
    
    def update(self, instance, validated_data):
        """Update an existing article."""
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Update category if provided
        if category_id is not None:
            if category_id:
                try:
                    category = ArticleCategory.objects.get(id=category_id)
                    instance.category = category
                except ArticleCategory.DoesNotExist:
                    raise serializers.ValidationError("Invalid category ID.")
            else:
                instance.category = None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            tags = ArticleTag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)
        
        return instance