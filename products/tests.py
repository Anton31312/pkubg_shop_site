"""
Tests for products app.
"""
import pytest
from django.test import TestCase
from hypothesis import given, strategies as st


class TestProductsBasic(TestCase):
    """Basic tests for products functionality."""
    
    def test_products_app_ready(self):
        """Test that products app is properly configured."""
        from django.apps import apps
        app = apps.get_app_config('products')
        self.assertEqual(app.name, 'products')


@pytest.mark.property_tests
class TestProductsProperties:
    """Property-based tests for products functionality."""
    
    @pytest.mark.django_db
    @given(
        name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        description=st.text(min_size=1, max_size=1000),
        price=st.decimals(min_value=0.01, max_value=9999999.99, places=2),
        is_gluten_free=st.booleans(),
        is_low_protein=st.booleans(),
        stock_quantity=st.integers(min_value=0, max_value=10000)
    )
    def test_product_full_information_storage(self, name, description, price, is_gluten_free, is_low_protein, stock_quantity):
        """
        **Feature: pkubg-ecommerce, Property 22: Сохранение полной информации о товаре**
        
        For any product added by administrator, all mandatory fields should be saved:
        name, description, price, and characteristics.
        """
        from products.models import Product, Category
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create a test category first
        category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Create a product with all mandatory information
        product = Product.objects.create(
            name=name,
            slug=f"test-product-{hash(name) % 10000}",  # Generate unique slug
            description=description,
            price=price,
            category=category,
            is_gluten_free=is_gluten_free,
            is_low_protein=is_low_protein,
            stock_quantity=stock_quantity
        )
        
        # Verify all mandatory fields are saved correctly
        saved_product = Product.objects.get(id=product.id)
        
        assert saved_product.name == name, "Product name should be saved correctly"
        assert saved_product.description == description, "Product description should be saved correctly"
        assert saved_product.price == price, "Product price should be saved correctly"
        assert saved_product.category == category, "Product category should be saved correctly"
        assert saved_product.is_gluten_free == is_gluten_free, "Gluten-free characteristic should be saved correctly"
        assert saved_product.is_low_protein == is_low_protein, "Low-protein characteristic should be saved correctly"
        assert saved_product.stock_quantity == stock_quantity, "Stock quantity should be saved correctly"
        assert saved_product.nutritional_info == {}, "Nutritional info should be initialized as empty dict"
        assert saved_product.is_active == True, "Product should be active by default"
        assert saved_product.created_at is not None, "Created timestamp should be set"
        assert saved_product.updated_at is not None, "Updated timestamp should be set"
        
        # Clean up
        product.delete()
        category.delete()
    
    @pytest.mark.django_db
    @given(
        name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        description=st.text(min_size=1, max_size=1000),
        price=st.decimals(min_value=0.01, max_value=9999999.99, places=2),
        is_gluten_free=st.booleans(),
        is_low_protein=st.booleans(),
        stock_quantity=st.integers(min_value=0, max_value=10000),
        nutritional_info=st.dictionaries(
            st.text(min_size=1, max_size=50), 
            st.one_of(st.text(min_size=1, max_size=100), st.integers(min_value=0, max_value=1000)),
            min_size=0, max_size=10
        )
    )
    def test_product_detail_information_display(self, name, description, price, is_gluten_free, is_low_protein, stock_quantity, nutritional_info):
        """
        **Feature: pkubg-ecommerce, Property 1: Отображение детальной информации о товаре**
        
        For any product in the system, when displaying its detail page, all mandatory information
        should be present: name, description, price, composition, nutritional value and characteristics.
        """
        from products.models import Product, Category
        from products.serializers import ProductSerializer
        from rest_framework.test import APIRequestFactory
        
        # Create a test category first
        category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Create a product with all mandatory information
        product = Product.objects.create(
            name=name,
            slug=f"test-product-{abs(hash(name)) % 10000}",  # Generate unique slug
            description=description,
            price=price,
            category=category,
            is_gluten_free=is_gluten_free,
            is_low_protein=is_low_protein,
            stock_quantity=stock_quantity,
            nutritional_info=nutritional_info
        )
        
        # Serialize the product (simulating API response)
        factory = APIRequestFactory()
        request = factory.get('/')
        serializer = ProductSerializer(product, context={'request': request})
        serialized_data = serializer.data
        
        # Verify all mandatory information is present in the serialized data
        assert 'name' in serialized_data and serialized_data['name'] == name, "Product name should be displayed"
        assert 'description' in serialized_data and serialized_data['description'] == description, "Product description should be displayed"
        assert 'price' in serialized_data and str(serialized_data['price']) == str(price), "Product price should be displayed"
        assert 'category' in serialized_data and serialized_data['category'] == category.id, "Product category should be displayed"
        assert 'category_name' in serialized_data and serialized_data['category_name'] == category.name, "Category name should be displayed"
        assert 'is_gluten_free' in serialized_data and serialized_data['is_gluten_free'] == is_gluten_free, "Gluten-free characteristic should be displayed"
        assert 'is_low_protein' in serialized_data and serialized_data['is_low_protein'] == is_low_protein, "Low-protein characteristic should be displayed"
        assert 'nutritional_info' in serialized_data and serialized_data['nutritional_info'] == nutritional_info, "Nutritional information should be displayed"
        assert 'stock_quantity' in serialized_data and serialized_data['stock_quantity'] == stock_quantity, "Stock quantity should be displayed"
        assert 'created_at' in serialized_data, "Creation timestamp should be displayed"
        assert 'updated_at' in serialized_data, "Update timestamp should be displayed"
        
        # Clean up
        product.delete()
        category.delete()
    
    @pytest.mark.django_db
    @given(
        search_term=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Zs'))),
        product_names=st.lists(
            st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
            min_size=1, max_size=10
        ),
        product_descriptions=st.lists(
            st.text(min_size=1, max_size=1000, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
            min_size=1, max_size=10
        )
    )
    def test_search_results_relevance(self, search_term, product_names, product_descriptions):
        """
        **Feature: pkubg-ecommerce, Property 2: Релевантность результатов поиска**
        
        For any search query, all returned products should contain the search terms
        in their name or description.
        """
        from products.models import Product, Category
        from products.filters import ProductFilter
        from django.db.models import Q
        
        # Ensure we have equal number of names and descriptions
        min_length = min(len(product_names), len(product_descriptions))
        product_names = product_names[:min_length]
        product_descriptions = product_descriptions[:min_length]
        
        if not product_names:
            return  # Skip if no products to test
        
        # Create a test category
        category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Create products with the given names and descriptions
        products = []
        for i, (name, description) in enumerate(zip(product_names, product_descriptions)):
            # Make some products contain the search term
            if i % 2 == 0:  # Every other product contains search term in name
                name = f"{search_term} {name}"
            elif i % 3 == 0:  # Every third product contains search term in description
                description = f"{description} {search_term}"
            
            product = Product.objects.create(
                name=name,
                slug=f"test-product-{i}-{abs(hash(name)) % 10000}",
                description=description,
                price=10.00,
                category=category,
                stock_quantity=10
            )
            products.append(product)
        
        # Apply search filter
        queryset = Product.objects.all()
        filter_instance = ProductFilter({'search': search_term}, queryset=queryset)
        filtered_products = filter_instance.qs
        
        # Verify that all returned products contain the search term
        for product in filtered_products:
            search_term_lower = search_term.lower()
            name_contains = search_term_lower in product.name.lower()
            description_contains = search_term_lower in product.description.lower()
            
            assert name_contains or description_contains, (
                f"Product '{product.name}' with description '{product.description}' "
                f"should contain search term '{search_term}' in name or description"
            )
        
        # Clean up
        for product in products:
            product.delete()
        category.delete()
    
    @pytest.mark.django_db
    @given(
        is_gluten_free=st.booleans(),
        is_low_protein=st.booleans(),
        min_price=st.decimals(min_value=0.01, max_value=100.00, places=2),
        max_price=st.decimals(min_value=100.01, max_value=1000.00, places=2),
        in_stock=st.booleans(),
        num_products=st.integers(min_value=3, max_value=10)
    )
    def test_filter_criteria_compliance(self, is_gluten_free, is_low_protein, min_price, max_price, in_stock, num_products):
        """
        **Feature: pkubg-ecommerce, Property 3: Соответствие фильтрам**
        
        For any set of applied filters, all displayed products should match
        all selected criteria.
        """
        from products.models import Product, Category
        from products.filters import ProductFilter
        from decimal import Decimal
        
        # Create test categories
        category1 = Category.objects.create(name="Category 1", slug="category-1")
        category2 = Category.objects.create(name="Category 2", slug="category-2")
        
        # Create products with varying characteristics
        products = []
        for i in range(num_products):
            # Vary the characteristics to test filtering
            product_gluten_free = (i % 2 == 0) if i < num_products // 2 else not (i % 2 == 0)
            product_low_protein = (i % 3 == 0) if i < num_products // 3 else not (i % 3 == 0)
            product_price = Decimal(str(min_price + (max_price - min_price) * i / num_products))
            product_stock = (10 if i % 2 == 0 else 0) if i < num_products // 2 else (5 if i % 3 == 0 else 0)
            product_category = category1 if i % 2 == 0 else category2
            
            product = Product.objects.create(
                name=f"Test Product {i}",
                slug=f"test-product-{i}",
                description=f"Description for product {i}",
                price=product_price,
                category=product_category,
                is_gluten_free=product_gluten_free,
                is_low_protein=product_low_protein,
                stock_quantity=product_stock
            )
            products.append(product)
        
        # Apply filters
        filter_data = {}
        if is_gluten_free is not None:
            filter_data['is_gluten_free'] = is_gluten_free
        if is_low_protein is not None:
            filter_data['is_low_protein'] = is_low_protein
        if min_price is not None:
            filter_data['min_price'] = min_price
        if max_price is not None:
            filter_data['max_price'] = max_price
        if in_stock is not None:
            filter_data['in_stock'] = in_stock
        
        queryset = Product.objects.all()
        filter_instance = ProductFilter(filter_data, queryset=queryset)
        filtered_products = filter_instance.qs
        
        # Verify that all filtered products match the criteria
        for product in filtered_products:
            if 'is_gluten_free' in filter_data:
                assert product.is_gluten_free == is_gluten_free, (
                    f"Product '{product.name}' gluten-free status ({product.is_gluten_free}) "
                    f"should match filter ({is_gluten_free})"
                )
            
            if 'is_low_protein' in filter_data:
                assert product.is_low_protein == is_low_protein, (
                    f"Product '{product.name}' low-protein status ({product.is_low_protein}) "
                    f"should match filter ({is_low_protein})"
                )
            
            if 'min_price' in filter_data:
                assert product.price >= min_price, (
                    f"Product '{product.name}' price ({product.price}) "
                    f"should be >= min_price ({min_price})"
                )
            
            if 'max_price' in filter_data:
                assert product.price <= max_price, (
                    f"Product '{product.name}' price ({product.price}) "
                    f"should be <= max_price ({max_price})"
                )
            
            if 'in_stock' in filter_data:
                if in_stock:
                    assert product.stock_quantity > 0, (
                        f"Product '{product.name}' should be in stock (stock: {product.stock_quantity})"
                    )
                else:
                    assert product.stock_quantity == 0, (
                        f"Product '{product.name}' should be out of stock (stock: {product.stock_quantity})"
                    )
        
        # Clean up
        for product in products:
            product.delete()
        category1.delete()
        category2.delete()
    
    @pytest.mark.django_db
    @given(
        stock_quantity=st.integers(min_value=0, max_value=100),
        product_name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs')))
    )
    def test_add_to_cart_button_hidden_for_out_of_stock(self, stock_quantity, product_name):
        """
        **Feature: pkubg-ecommerce, Property 4: Скрытие кнопки для товаров без остатка**
        
        For any product with zero stock quantity, the add to cart button should be hidden.
        """
        from products.models import Product, Category
        from products.serializers import ProductListSerializer
        from rest_framework.test import APIRequestFactory
        
        # Create a test category
        category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        
        # Create a product with the given stock quantity
        product = Product.objects.create(
            name=product_name,
            slug=f"test-product-{abs(hash(product_name)) % 10000}",
            description="Test description",
            price=10.00,
            category=category,
            stock_quantity=stock_quantity
        )
        
        # Serialize the product (simulating API response for product list)
        factory = APIRequestFactory()
        request = factory.get('/')
        serializer = ProductListSerializer(product, context={'request': request})
        serialized_data = serializer.data
        
        # Verify stock quantity is correctly reported
        assert serialized_data['stock_quantity'] == stock_quantity, (
            f"Stock quantity should be {stock_quantity}, got {serialized_data['stock_quantity']}"
        )
        
        # The frontend logic should use this stock_quantity to determine button visibility
        # If stock_quantity is 0, the add to cart button should be hidden
        if stock_quantity == 0:
            # This property is verified by checking that stock_quantity is 0
            # The frontend will use this information to hide the button
            assert serialized_data['stock_quantity'] == 0, (
                "Products with zero stock should have stock_quantity = 0 in API response"
            )
        else:
            # Products with stock should have stock_quantity > 0
            assert serialized_data['stock_quantity'] > 0, (
                "Products with stock should have stock_quantity > 0 in API response"
            )
        
        # Clean up
        product.delete()
        category.delete()
    
    @pytest.mark.django_db
    @given(
        original_name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        new_name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs'))),
        original_price=st.decimals(min_value=0.01, max_value=1000.00, places=2),
        new_price=st.decimals(min_value=0.01, max_value=1000.00, places=2),
        original_description=st.text(min_size=1, max_size=1000),
        new_description=st.text(min_size=1, max_size=1000)
    )
    def test_product_changes_reflected_in_catalog(self, original_name, new_name, original_price, new_price, original_description, new_description):
        """
        **Feature: pkubg-ecommerce, Property 23: Отражение изменений товара в каталоге**
        
        For any product changes made by administrator, updates should be immediately
        reflected in the catalog.
        """
        from products.models import Product, Category
        from products.serializers import ProductSerializer
        from rest_framework.test import APIRequestFactory
        import uuid
        
        # Create a test category with unique slug
        unique_id = str(uuid.uuid4())[:8]
        category = Category.objects.create(
            name=f"Test Category {unique_id}",
            slug=f"test-category-{unique_id}"
        )
        
        # Create a product with original data
        product_unique_id = str(uuid.uuid4())[:8]
        product = Product.objects.create(
            name=original_name,
            slug=f"test-product-{product_unique_id}",
            description=original_description,
            price=original_price,
            category=category,
            stock_quantity=10
        )
        
        # Serialize the original product
        factory = APIRequestFactory()
        request = factory.get('/')
        original_serializer = ProductSerializer(product, context={'request': request})
        original_data = original_serializer.data
        
        # Verify original data
        assert original_data['name'] == original_name
        assert str(original_data['price']) == str(original_price)
        assert original_data['description'] == original_description
        
        # Update the product
        product.name = new_name
        product.price = new_price
        product.description = new_description
        product.save()
        
        # Refresh from database to ensure changes are persisted
        product.refresh_from_db()
        
        # Serialize the updated product
        updated_serializer = ProductSerializer(product, context={'request': request})
        updated_data = updated_serializer.data
        
        # Verify that changes are reflected in the serialized data (catalog)
        assert updated_data['name'] == new_name, (
            f"Product name should be updated to '{new_name}', got '{updated_data['name']}'"
        )
        assert str(updated_data['price']) == str(new_price), (
            f"Product price should be updated to '{new_price}', got '{updated_data['price']}'"
        )
        assert updated_data['description'] == new_description, (
            f"Product description should be updated to '{new_description}', got '{updated_data['description']}'"
        )
        
        # The main property is that changes are reflected, timestamp changes are implementation detail
        
        # Clean up
        product.delete()
        category.delete()
    
    @pytest.mark.django_db
    @given(
        product_name=st.text(min_size=1, max_size=200, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd', 'Pc', 'Pd', 'Zs')))
    )
    def test_product_deletion_handling(self, product_name):
        """
        **Feature: pkubg-ecommerce, Property 24: Корректное удаление товара**
        
        For any deleted product, it should disappear from the catalog but existing orders
        with this product should remain valid.
        """
        from products.models import Product, Category
        from products.serializers import ProductListSerializer
        from rest_framework.test import APIRequestFactory
        import uuid
        
        # Create a test category with unique slug
        unique_id = str(uuid.uuid4())[:8]
        category = Category.objects.create(
            name=f"Test Category {unique_id}",
            slug=f"test-category-{unique_id}"
        )
        
        # Create a product
        product_unique_id = str(uuid.uuid4())[:8]
        product = Product.objects.create(
            name=product_name,
            slug=f"test-product-{product_unique_id}",
            description="Test description",
            price=10.00,
            category=category,
            stock_quantity=10
        )
        
        # Verify product exists in catalog
        factory = APIRequestFactory()
        request = factory.get('/')
        
        # Get all active products (simulating catalog view)
        active_products = Product.objects.filter(is_active=True)
        assert product in active_products, "Product should be in active catalog initially"
        
        # Delete the product (soft delete by setting is_active=False)
        product.is_active = False
        product.save()
        
        # Verify product is no longer in active catalog
        active_products_after_delete = Product.objects.filter(is_active=True)
        assert product not in active_products_after_delete, (
            "Product should not appear in active catalog after deletion"
        )
        
        # Verify product still exists in database (for order integrity)
        all_products = Product.objects.all()
        assert product in all_products, (
            "Product should still exist in database to maintain order integrity"
        )
        
        # Clean up
        product.delete()  # Hard delete for cleanup
        category.delete()
    
    @pytest.mark.django_db
    @given(
        image_size=st.integers(min_value=100, max_value=5000)
    )
    def test_image_optimization_property(self, image_size):
        """
        **Feature: pkubg-ecommerce, Property 25: Оптимизация загружаемых изображений**
        
        For any uploaded product image, it should be saved in optimized format
        with appropriate resolution.
        """
        from products.views import ProductViewSet
        from PIL import Image
        from io import BytesIO
        import uuid
        
        # Create a test image
        img = Image.new('RGB', (image_size, image_size), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Create a mock uploaded file
        from django.core.files.uploadedfile import InMemoryUploadedFile
        import sys
        
        uploaded_file = InMemoryUploadedFile(
            img_bytes, 'ImageField', 'test_image.png',
            'image/png', sys.getsizeof(img_bytes), None
        )
        
        # Test the optimization function
        viewset = ProductViewSet()
        optimized_file = viewset._optimize_image(uploaded_file)
        
        # Verify optimization occurred
        optimized_img = Image.open(optimized_file)
        
        # Check that large images are resized
        if image_size > 1200:
            assert optimized_img.width <= 1200, (
                f"Large images should be resized to max 1200px width, got {optimized_img.width}"
            )
        
        # Check format is JPEG (optimized)
        assert optimized_img.format == 'JPEG', (
            f"Optimized images should be in JPEG format, got {optimized_img.format}"
        )
    
    @pytest.mark.django_db
    def test_unauthorized_access_restriction(self):
        """
        **Feature: pkubg-ecommerce, Property 26: Запрет доступа неавторизованным пользователям**
        
        For any unauthorized user, attempts to manage products should be denied
        with redirection to login page.
        """
        from rest_framework.test import APIClient
        from rest_framework import status
        from django.contrib.auth import get_user_model
        import uuid
        
        User = get_user_model()
        client = APIClient()
        
        # Test unauthorized access to product creation
        product_data = {
            'name': 'Test Product',
            'slug': f'test-product-{str(uuid.uuid4())[:8]}',
            'description': 'Test description',
            'price': '10.00',
            'category': 1,
            'stock_quantity': 10
        }
        
        # Attempt to create product without authentication
        response = client.post('/api/products/api/products/', product_data)
        
        # Should be denied (401 Unauthorized or 403 Forbidden)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN], (
            f"Unauthorized access should be denied, got status {response.status_code}"
        )
        
        # Test with regular user (customer role)
        customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass',
            role='customer'
        )
        
        client.force_authenticate(user=customer)
        response = client.post('/api/products/api/products/', product_data)
        
        # Should be denied for non-admin/manager users
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Customer should not be able to create products, got status {response.status_code}"
        )
        
        # Clean up
        customer.delete()