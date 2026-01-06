from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ArticleCategory(models.Model):
    """Article category model."""
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    class Meta:
        verbose_name_plural = "Article Categories"
    
    def __str__(self):
        return self.name


class ArticleTag(models.Model):
    """Article tag model."""
    
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name


class Article(models.Model):
    """Article model."""
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    excerpt = models.TextField(max_length=500)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(ArticleCategory, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(ArticleTag, blank=True)
    featured_image = models.ImageField(upload_to='articles/', blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title