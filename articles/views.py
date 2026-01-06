"""
Views for articles app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Article, ArticleCategory, ArticleTag
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer, 
    ArticleCreateUpdateSerializer, ArticleCategorySerializer, 
    ArticleTagSerializer
)


class IsAdminOrManagerPermission(permissions.BasePermission):
    """
    Custom permission to only allow admin and manager users to create/edit articles.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )


class ArticleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing articles.
    
    Provides CRUD operations for articles with proper permissions:
    - Read access: All users
    - Write access: Admin and Manager users only
    """
    
    queryset = Article.objects.all()
    permission_classes = [IsAdminOrManagerPermission]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_published', 'author']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        else:
            return ArticleDetailSerializer
    
    def get_queryset(self):
        """
        Filter queryset based on user permissions.
        Regular users only see published articles.
        Admin/Manager users see all articles.
        """
        queryset = Article.objects.all()
        
        # If user is not admin/manager, only show published articles
        if not (self.request.user.is_authenticated and 
                self.request.user.role in ['admin', 'manager']):
            queryset = queryset.filter(is_published=True)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManagerPermission])
    def publish(self, request, pk=None):
        """Publish an article."""
        article = self.get_object()
        article.is_published = True
        article.save()
        
        serializer = self.get_serializer(article)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManagerPermission])
    def unpublish(self, request, pk=None):
        """Unpublish (archive) an article."""
        article = self.get_object()
        article.is_published = False
        article.save()
        
        serializer = self.get_serializer(article)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get only published articles."""
        queryset = self.get_queryset().filter(is_published=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ArticleListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrManagerPermission])
    def archived(self, request):
        """Get archived (unpublished) articles - admin/manager only."""
        queryset = Article.objects.filter(is_published=False)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ArticleListSerializer(queryset, many=True)
        return Response(serializer.data)


class ArticleCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing article categories.
    """
    
    queryset = ArticleCategory.objects.all()
    serializer_class = ArticleCategorySerializer
    permission_classes = [IsAdminOrManagerPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']


class ArticleTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing article tags.
    """
    
    queryset = ArticleTag.objects.all()
    serializer_class = ArticleTagSerializer
    permission_classes = [IsAdminOrManagerPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']