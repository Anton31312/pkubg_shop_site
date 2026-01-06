from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from transliterate import translit


class Category(models.Model):
    """Product category model."""
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            # Transliterate Russian text to Latin
            try:
                transliterated = translit(self.name, 'ru', reversed=True)
            except:
                # Fallback to original name if transliteration fails
                transliterated = self.name
            
            base_slug = slugify(transliterated)
            slug = base_slug
            counter = 1
            
            # Ensure unique slug
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


def get_default_nutritional_info():
    """Default nutritional information template."""
    return {
        "per_100g": {
            "calories": 0,  # ккал
            "proteins": 0.0,  # г
            "fats": 0.0,  # г
            "carbohydrates": 0.0,  # г
            "fiber": 0.0,  # г
            "sugar": 0.0,  # г
            "salt": 0.0,  # г
            "sodium": 0.0  # мг
        },
        "vitamins": {
            "vitamin_a": 0.0,  # мкг
            "vitamin_c": 0.0,  # мг
            "vitamin_d": 0.0,  # мкг
            "vitamin_e": 0.0,  # мг
            "vitamin_k": 0.0,  # мкг
            "thiamine_b1": 0.0,  # мг
            "riboflavin_b2": 0.0,  # мг
            "niacin_b3": 0.0,  # мг
            "vitamin_b6": 0.0,  # мг
            "folate_b9": 0.0,  # мкг
            "vitamin_b12": 0.0  # мкг
        },
        "minerals": {
            "calcium": 0.0,  # мг
            "iron": 0.0,  # мг
            "magnesium": 0.0,  # мг
            "phosphorus": 0.0,  # мг
            "potassium": 0.0,  # мг
            "zinc": 0.0,  # мг
            "copper": 0.0,  # мг
            "manganese": 0.0,  # мг
            "selenium": 0.0  # мкг
        },
        "allergens": [],  # Список аллергенов: ["глютен", "молоко", "яйца", "орехи", "соя", "рыба", "моллюски"]
        "dietary_info": {
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": False,
            "is_lactose_free": False,
            "is_sugar_free": False,
            "is_organic": False,
            "is_kosher": False,
            "is_halal": False
        },
        "storage_info": {
            "temperature": "комнатная температура",  # "холодильник", "морозилка", "комнатная температура"
            "shelf_life_days": 365,  # срок годности в днях
            "storage_conditions": "Хранить в сухом прохладном месте"
        },
        "serving_info": {
            "serving_size_g": 100,  # размер порции в граммах
            "servings_per_package": 1,  # количество порций в упаковке
            "preparation_instructions": ""  # инструкции по приготовлению
        }
    }


class Product(models.Model):
    """Product model."""
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
    # Новые поля
    manufacturer = models.CharField(max_length=200, blank=True, verbose_name="Производитель")
    composition = models.TextField(blank=True, verbose_name="Состав")
    storage_conditions = models.TextField(blank=True, verbose_name="Условия хранения")
    
    # Существующие поля
    is_gluten_free = models.BooleanField(default=False)
    is_low_protein = models.BooleanField(default=False)
    nutritional_info = models.JSONField(default=get_default_nutritional_info)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            # Transliterate Russian text to Latin
            try:
                transliterated = translit(self.name, 'ru', reversed=True)
            except:
                # Fallback to original name if transliteration fails
                transliterated = self.name
            
            base_slug = slugify(transliterated)
            slug = base_slug
            counter = 1
            
            # Ensure unique slug
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Product image model."""
    
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200)
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Image for {self.product.name}"