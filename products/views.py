"""
Views for products API.
"""
from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

from .models import Product, Category, ProductImage
from .serializers import (
    ProductSerializer, ProductListSerializer, 
    CategorySerializer, ProductImageSerializer
)
from .permissions import IsAdminOrManagerOrReadOnly, IsAdminOrManager
from .filters import ProductFilter


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing product categories."""
    
    queryset = Category.objects.filter(is_active=True).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Filter categories based on user permissions."""
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'manager']:
            return Category.objects.all().order_by('name')
        return Category.objects.filter(is_active=True).order_by('name')


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing products with full CRUD operations."""
    
    queryset = Product.objects.select_related('category').prefetch_related('images')
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at', 'stock_quantity']
    ordering = ['-created_at']
    lookup_field = 'slug'
    
    def get_object(self):
        """Get object by ID or slug."""
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Try to get by ID first (if it's a number)
        if lookup_value.isdigit():
            try:
                return self.get_queryset().get(id=int(lookup_value))
            except Product.DoesNotExist:
                pass
        
        # Fall back to slug lookup
        return self.get_queryset().get(slug=lookup_value)
    
    def perform_create(self, serializer):
        """Handle product creation."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating product with data: {self.request.data}")
        
        try:
            serializer.save()
            logger.info("Product created successfully")
        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            raise
    
    def perform_update(self, serializer):
        """Handle product update."""
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed logging."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"POST /products/products/ - Request data: {request.data}")
        logger.info(f"User: {request.user}")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error in create: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_queryset(self):
        """Filter products based on user permissions."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Log query parameters
        logger.info(f"Query params: {self.request.query_params}")
        
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'manager']:
            queryset = self.queryset.all()
        else:
            queryset = self.queryset.filter(is_active=True)
        
        # Log the count before and after filtering
        logger.info(f"Products before filtering: {queryset.count()}")
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrManager])
    def upload_image(self, request, slug=None):
        """Upload and optimize product image."""
        import logging
        import os
        from django.conf import settings
        
        logger = logging.getLogger(__name__)
        
        logger.info(f"Upload image request for product: {slug}")
        logger.info(f"Request FILES: {list(request.FILES.keys())}")
        logger.info(f"Request data: {request.data}")
        logger.info(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        logger.info(f"MEDIA_ROOT exists: {os.path.exists(settings.MEDIA_ROOT)}")
        logger.info(f"MEDIA_ROOT writable: {os.access(settings.MEDIA_ROOT, os.W_OK)}")
        
        product = self.get_object()
        
        if 'image' not in request.FILES:
            logger.error("No 'image' field in request.FILES")
            return Response(
                {'error': 'No image file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        alt_text = request.data.get('alt_text', f'Image for {product.name}')
        is_primary_raw = request.data.get('is_primary', False)
        
        # Convert string 'true'/'false' to boolean
        if isinstance(is_primary_raw, str):
            is_primary = is_primary_raw.lower() in ('true', '1', 'yes')
        else:
            is_primary = bool(is_primary_raw)
            
        logger.info(f"is_primary_raw: {is_primary_raw}, is_primary: {is_primary}")
        logger.info(f"Original file: {image_file.name}, size: {image_file.size}, content_type: {image_file.content_type}")
        
        # Optimize image
        try:
            optimized_image = self._optimize_image(image_file)
            logger.info(f"Image optimized: {optimized_image.name}, size: {optimized_image.size}")
            
            # Create ProductImage instance
            product_image = ProductImage.objects.create(
                product=product,
                image=optimized_image,
                alt_text=alt_text,
                is_primary=is_primary
            )
            
            logger.info(f"ProductImage created: ID={product_image.id}")
            logger.info(f"Image path: {product_image.image.name}")
            logger.info(f"Image URL: {product_image.image.url}")
            
            # Check if file exists on disk
            full_path = os.path.join(settings.MEDIA_ROOT, product_image.image.name)
            file_exists = os.path.exists(full_path)
            logger.info(f"File exists on disk: {file_exists}")
            if file_exists:
                file_size = os.path.getsize(full_path)
                logger.info(f"File size on disk: {file_size} bytes")
            else:
                logger.error(f"File NOT found at: {full_path}")
                logger.error(f"Directory exists: {os.path.exists(os.path.dirname(full_path))}")
                logger.error(f"Directory writable: {os.access(os.path.dirname(full_path), os.W_OK)}")
            
            # If this is set as primary, unset other primary images
            if is_primary:
                ProductImage.objects.filter(
                    product=product
                ).exclude(id=product_image.id).update(is_primary=False)
            
            serializer = ProductImageSerializer(product_image, context={'request': request})
            logger.info(f"Image uploaded successfully. URL: {serializer.data.get('image')}")
            logger.info(f"Full serializer data: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Image upload failed: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Image upload failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _optimize_image(self, image_file):
        """Optimize uploaded image for web use."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Optimizing image: {image_file.name}, size: {image_file.size}")
        
        try:
            # Open image with PIL
            img = Image.open(image_file)
            logger.info(f"Image opened: mode={img.mode}, size={img.size}, format={img.format}")
            
            # Determine output format
            has_transparency = img.mode in ('RGBA', 'LA', 'P') and (
                img.mode == 'P' and 'transparency' in img.info or
                img.mode in ('RGBA', 'LA')
            )
            
            # If image has transparency, keep as PNG
            if has_transparency:
                logger.info("Image has transparency, keeping as PNG")
                output_format = 'PNG'
                file_extension = 'png'
                
                # Convert palette images to RGBA for better quality
                if img.mode == 'P':
                    img = img.convert('RGBA')
            else:
                logger.info("Image has no transparency, converting to JPEG")
                output_format = 'JPEG'
                file_extension = 'jpg'
                
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    logger.info(f"Converting from {img.mode} to RGB")
                    # Create white background
                    if img.mode == 'RGBA':
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
                        img = background
                    else:
                        img = img.convert('RGB')
            
            # Resize if too large (max 1200px width)
            max_width = 1200
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                logger.info(f"Resizing from {img.size} to ({max_width}, {new_height})")
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Save optimized image to BytesIO
            output = BytesIO()
            if output_format == 'PNG':
                img.save(output, format='PNG', optimize=True)
            else:
                img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            # Get original filename without extension
            original_name = image_file.name.rsplit('.', 1)[0]
            
            # Create new InMemoryUploadedFile
            optimized_file = InMemoryUploadedFile(
                output, 
                'ImageField', 
                f"{original_name}_optimized.{file_extension}",
                f'image/{file_extension}',
                output.getbuffer().nbytes,
                None
            )
            
            logger.info(f"Image optimized successfully: {optimized_file.name}, size: {optimized_file.size}")
            return optimized_file
            
        except Exception as e:
            logger.error(f"Error optimizing image: {str(e)}", exc_info=True)
            # If optimization fails, return original file
            logger.warning("Returning original file without optimization")
            image_file.seek(0)
            return image_file
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrManager])
    def toggle_active(self, request, slug=None):
        """Toggle product active status (hide/show product)."""
        product = self.get_object()
        product.is_active = not product.is_active
        product.save()
        
        serializer = self.get_serializer(product)
        return Response({
            'message': f'Товар {"показан" if product.is_active else "скрыт"}',
            'product': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def manufacturers(self, request):
        """Get list of unique manufacturers."""
        manufacturers = Product.objects.filter(
            is_active=True,
            manufacturer__isnull=False
        ).exclude(
            manufacturer__exact=''
        ).values_list('manufacturer', flat=True).distinct().order_by('manufacturer')
        
        return Response(list(manufacturers))
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Enhanced search endpoint with detailed filtering."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Additional search logic can be added here
        search_term = request.query_params.get('q', '')
        if search_term:
            queryset = queryset.filter(
                models.Q(name__icontains=search_term) | 
                models.Q(description__icontains=search_term)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing product images."""
    
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminOrManager]
    
    def perform_create(self, serializer):
        """Handle image optimization during creation."""
        image_file = self.request.FILES.get('image')
        if image_file:
            # Optimize the image before saving
            product_viewset = ProductViewSet()
            optimized_image = product_viewset._optimize_image(image_file)
            serializer.save(image=optimized_image)
        else:
            serializer.save()