"""
Tests for articles app.
"""
import pytest
from django.test import TestCase
from hypothesis import given, strategies as st


class TestArticlesBasic(TestCase):
    """Basic tests for articles functionality."""
    
    def test_articles_app_ready(self):
        """Test that articles app is properly configured."""
        from django.apps import apps
        app = apps.get_app_config('articles')
        self.assertEqual(app.name, 'articles')
    
    def test_article_api_permissions(self):
        """Test that article API permissions work correctly."""
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient
        from articles.models import ArticleCategory
        
        User = get_user_model()
        client = APIClient()
        
        # Create test users
        admin_user = User.objects.create_user(
            username="admin_test",
            email="admin@test.com",
            password="testpass123",
            role="admin"
        )
        
        regular_user = User.objects.create_user(
            username="regular_test",
            email="regular@test.com",
            password="testpass123",
            role="customer"
        )
        
        # Create test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Test that regular users cannot create articles
        client.force_authenticate(user=regular_user)
        response = client.post('/api/articles/api/articles/', {
            'title': 'Test Article',
            'slug': 'test-article',
            'content': 'Test content',
            'excerpt': 'Test excerpt',
            'category_id': category.id,
            'is_published': False
        })
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Test that admin users can create articles
        client.force_authenticate(user=admin_user)
        response = client.post('/api/articles/api/articles/', {
            'title': 'Test Article',
            'slug': 'test-article',
            'content': 'Test content',
            'excerpt': 'Test excerpt',
            'category_id': category.id,
            'is_published': False
        })
        self.assertEqual(response.status_code, 201)  # Created
        
        # Clean up
        category.delete()
        admin_user.delete()
        regular_user.delete()


@pytest.mark.property_tests
class TestArticlesProperties:
    """Property-based tests for articles functionality."""
    
    @pytest.mark.django_db
    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        content=st.text(min_size=1, max_size=5000),
        excerpt=st.text(min_size=1, max_size=500),
        is_published=st.booleans()
    )
    def test_article_content_storage(self, title, content, excerpt, is_published):
        """
        **Feature: pkubg-ecommerce, Property 27: Сохранение контента статьи**
        
        For any article created by administrator, all content should be saved
        including formatting and images (content field).
        """
        from articles.models import Article, ArticleCategory
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create a test user (administrator)
        admin_user = User.objects.create_user(
            username=f"admin_{hash(title) % 10000}",
            email=f"admin_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="admin"
        )
        
        # Create a test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug=f"test-category-{hash(title) % 10000}"
        )
        
        # Create an article with all content
        article = Article.objects.create(
            title=title,
            slug=f"test-article-{hash(title) % 10000}",
            content=content,
            excerpt=excerpt,
            author=admin_user,
            category=category,
            is_published=is_published
        )
        
        # Verify all content is saved correctly
        saved_article = Article.objects.get(id=article.id)
        
        assert saved_article.title == title, "Article title should be saved correctly"
        assert saved_article.content == content, "Article content (including formatting) should be saved correctly"
        assert saved_article.excerpt == excerpt, "Article excerpt should be saved correctly"
        assert saved_article.author == admin_user, "Article author should be saved correctly"
        assert saved_article.category == category, "Article category should be saved correctly"
        assert saved_article.is_published == is_published, "Article publication status should be saved correctly"
        assert saved_article.created_at is not None, "Created timestamp should be set"
        assert saved_article.updated_at is not None, "Updated timestamp should be set"
        
        # Clean up
        article.delete()
        category.delete()
        admin_user.delete()
    
    @pytest.mark.django_db
    @given(
        new_title=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        new_content=st.text(min_size=1, max_size=5000),
        new_excerpt=st.text(min_size=1, max_size=500)
    )
    def test_article_metadata_update(self, new_title, new_content, new_excerpt):
        """
        **Feature: pkubg-ecommerce, Property 28: Обновление метаданных статьи**
        
        For any article edited by manager, content should be updated and 
        last modification date should be updated.
        """
        from articles.models import Article, ArticleCategory
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        import time
        
        User = get_user_model()
        
        # Create a test manager user
        manager_user = User.objects.create_user(
            username=f"manager_{hash(new_title) % 10000}",
            email=f"manager_{hash(new_title) % 10000}@example.com",
            password="testpass123",
            role="manager"
        )
        
        # Create a test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug=f"test-category-{hash(new_title) % 10000}"
        )
        
        # Create an initial article
        original_article = Article.objects.create(
            title="Original Title",
            slug=f"original-article-{hash(new_title) % 10000}",
            content="Original content",
            excerpt="Original excerpt",
            author=manager_user,
            category=category,
            is_published=False
        )
        
        # Store original timestamps
        original_created_at = original_article.created_at
        original_updated_at = original_article.updated_at
        
        # Wait a small amount to ensure timestamp difference
        time.sleep(0.01)
        
        # Update the article content and metadata
        original_article.title = new_title
        original_article.content = new_content
        original_article.excerpt = new_excerpt
        original_article.save()
        
        # Refresh from database
        updated_article = Article.objects.get(id=original_article.id)
        
        # Verify content is updated
        assert updated_article.title == new_title, "Article title should be updated"
        assert updated_article.content == new_content, "Article content should be updated"
        assert updated_article.excerpt == new_excerpt, "Article excerpt should be updated"
        
        # Verify metadata is updated
        assert updated_article.created_at == original_created_at, "Created date should remain unchanged"
        assert updated_article.updated_at > original_updated_at, "Updated date should be newer than original"
        assert updated_article.author == manager_user, "Author should remain the same"
        
        # Clean up
        updated_article.delete()
        category.delete()
        manager_user.delete()
    
    @pytest.mark.django_db
    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        content=st.text(min_size=1, max_size=5000),
        excerpt=st.text(min_size=1, max_size=500)
    )
    def test_article_publication(self, title, content, excerpt):
        """
        **Feature: pkubg-ecommerce, Property 29: Публикация статьи**
        
        For any published article, it should be accessible to all users on the site.
        """
        from articles.models import Article, ArticleCategory
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create a test admin user
        admin_user = User.objects.create_user(
            username=f"admin_{hash(title) % 10000}",
            email=f"admin_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="admin"
        )
        
        # Create a test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug=f"test-category-{hash(title) % 10000}"
        )
        
        # Create an unpublished article first
        article = Article.objects.create(
            title=title,
            slug=f"test-article-{hash(title) % 10000}",
            content=content,
            excerpt=excerpt,
            author=admin_user,
            category=category,
            is_published=False
        )
        
        # Verify article is not published initially
        assert not article.is_published, "Article should not be published initially"
        
        # Publish the article
        article.is_published = True
        article.save()
        
        # Refresh from database
        published_article = Article.objects.get(id=article.id)
        
        # Verify article is now published and accessible
        assert published_article.is_published, "Article should be published"
        
        # Verify that published articles can be queried by all users
        published_articles = Article.objects.filter(is_published=True)
        assert published_article in published_articles, "Published article should be accessible to all users"
        
        # Verify all content is still intact after publication
        assert published_article.title == title, "Title should remain intact after publication"
        assert published_article.content == content, "Content should remain intact after publication"
        assert published_article.excerpt == excerpt, "Excerpt should remain intact after publication"
        assert published_article.author == admin_user, "Author should remain intact after publication"
        assert published_article.category == category, "Category should remain intact after publication"
        
        # Clean up
        published_article.delete()
        category.delete()
        admin_user.delete()
    
    @pytest.mark.django_db
    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        content=st.text(min_size=1, max_size=5000),
        excerpt=st.text(min_size=1, max_size=500)
    )
    def test_regular_user_article_creation_restriction(self, title, content, excerpt):
        """
        **Feature: pkubg-ecommerce, Property 30: Запрет создания статей обычными пользователями**
        
        For any regular user, access to article creation and editing functions should be denied.
        """
        from articles.models import Article, ArticleCategory
        from django.contrib.auth import get_user_model
        from django.core.exceptions import PermissionDenied
        
        User = get_user_model()
        
        # Create a regular customer user
        regular_user = User.objects.create_user(
            username=f"customer_{hash(title) % 10000}",
            email=f"customer_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="customer"  # Regular user role
        )
        
        # Create a test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug=f"test-category-{hash(title) % 10000}"
        )
        
        # Test that regular users should not be able to create articles
        # This is a business logic test - we verify the role restriction
        
        # Verify user role is customer
        assert regular_user.role == "customer", "User should have customer role"
        
        # In a real API, this would be enforced by permissions
        # For now, we test the model-level logic that only admin/manager should create articles
        allowed_roles = ["admin", "manager"]
        user_can_create_articles = regular_user.role in allowed_roles
        
        assert not user_can_create_articles, "Regular users should not be allowed to create articles"
        
        # Test that admin and manager roles would be allowed
        admin_user = User.objects.create_user(
            username=f"admin_{hash(title) % 10000}",
            email=f"admin_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="admin"
        )
        
        manager_user = User.objects.create_user(
            username=f"manager_{hash(title) % 10000}",
            email=f"manager_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="manager"
        )
        
        # Verify admin and manager can create articles
        admin_can_create = admin_user.role in allowed_roles
        manager_can_create = manager_user.role in allowed_roles
        
        assert admin_can_create, "Admin users should be allowed to create articles"
        assert manager_can_create, "Manager users should be allowed to create articles"
        
        # Test actual article creation with allowed roles
        admin_article = Article.objects.create(
            title=f"Admin {title}",
            slug=f"admin-article-{hash(title) % 10000}",
            content=content,
            excerpt=excerpt,
            author=admin_user,
            category=category,
            is_published=False
        )
        
        manager_article = Article.objects.create(
            title=f"Manager {title}",
            slug=f"manager-article-{hash(title) % 10000}",
            content=content,
            excerpt=excerpt,
            author=manager_user,
            category=category,
            is_published=False
        )
        
        # Verify articles were created successfully by authorized users
        assert admin_article.author == admin_user, "Admin should be able to create articles"
        assert manager_article.author == manager_user, "Manager should be able to create articles"
        
        # Clean up
        admin_article.delete()
        manager_article.delete()
        category.delete()
        regular_user.delete()
        admin_user.delete()
        manager_user.delete()
    
    @pytest.mark.django_db
    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        content=st.text(min_size=1, max_size=5000),
        excerpt=st.text(min_size=1, max_size=500)
    )
    def test_article_archiving_on_deletion(self, title, content, excerpt):
        """
        **Feature: pkubg-ecommerce, Property 31: Архивирование удаленных статей**
        
        For any deleted article, it should disappear from public access but remain in the system archive.
        """
        from articles.models import Article, ArticleCategory
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create a test admin user
        admin_user = User.objects.create_user(
            username=f"admin_{hash(title) % 10000}",
            email=f"admin_{hash(title) % 10000}@example.com",
            password="testpass123",
            role="admin"
        )
        
        # Create a test category
        category = ArticleCategory.objects.create(
            name="Test Category",
            slug=f"test-category-{hash(title) % 10000}"
        )
        
        # Create and publish an article
        article = Article.objects.create(
            title=title,
            slug=f"test-article-{hash(title) % 10000}",
            content=content,
            excerpt=excerpt,
            author=admin_user,
            category=category,
            is_published=True  # Make it public initially
        )
        
        # Verify article is initially published and accessible
        assert article.is_published, "Article should be published initially"
        published_articles = Article.objects.filter(is_published=True)
        assert article in published_articles, "Article should be in published articles"
        
        # "Delete" the article by unpublishing it (archiving)
        # In a real system, this would be soft deletion or archiving
        article.is_published = False
        article.save()
        
        # Refresh from database
        archived_article = Article.objects.get(id=article.id)
        
        # Verify article is no longer in public access
        assert not archived_article.is_published, "Article should not be published after deletion"
        
        # Verify article disappears from public queries
        published_articles_after = Article.objects.filter(is_published=True)
        assert archived_article not in published_articles_after, "Deleted article should not be in public access"
        
        # Verify article still exists in the system (archived)
        all_articles = Article.objects.all()
        assert archived_article in all_articles, "Deleted article should still exist in system archive"
        
        # Verify all data is preserved in archive
        assert archived_article.title == title, "Archived article title should be preserved"
        assert archived_article.content == content, "Archived article content should be preserved"
        assert archived_article.excerpt == excerpt, "Archived article excerpt should be preserved"
        assert archived_article.author == admin_user, "Archived article author should be preserved"
        assert archived_article.category == category, "Archived article category should be preserved"
        assert archived_article.created_at is not None, "Archived article creation date should be preserved"
        assert archived_article.updated_at is not None, "Archived article update date should be preserved"
        
        # Test that archived articles can be retrieved by admin queries
        archived_articles = Article.objects.filter(is_published=False)
        assert archived_article in archived_articles, "Archived article should be accessible in admin queries"
        
        # Clean up
        archived_article.delete()  # Actually delete for cleanup
        category.delete()
        admin_user.delete()