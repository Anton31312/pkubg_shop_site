from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, ArticleCategoryViewSet, ArticleTagViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'categories', ArticleCategoryViewSet)
router.register(r'tags', ArticleTagViewSet)

urlpatterns = [
    path('', include(router.urls)),
]