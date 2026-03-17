from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'is_active')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'description', 'parent')
        }),
        ('Настройки', {
            'fields': ('is_active',)
        }),
    )


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductAdminForm(forms.ModelForm):
    """Custom form for Product admin with better nutritional_info handling."""
    
    class Meta:
        model = Product
        fields = '__all__'
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4, 'cols': 80}),
            'composition': forms.Textarea(attrs={
                'rows': 6, 
                'cols': 80,
                'placeholder': 'Укажите состав продукта, включая все ингредиенты в порядке убывания их массовой доли'
            }),
            'storage_conditions': forms.Textarea(attrs={
                'rows': 3, 
                'cols': 80,
                'placeholder': 'Например: Хранить в сухом прохладном месте при температуре не выше +25°C. Беречь от прямых солнечных лучей.'
            }),
            'manufacturer': forms.TextInput(attrs={
                'size': 80,
                'placeholder': 'Название компании-производителя'
            }),
            'nutritional_info': forms.Textarea(attrs={
                'rows': 25, 
                'cols': 80,
                'style': 'font-family: monospace; font-size: 12px;'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add help text for nutritional_info field
        from django.utils.safestring import mark_safe
        self.fields['nutritional_info'].help_text = mark_safe(
            '<strong>Шаблон пищевой ценности уже заполнен.</strong><br>'
            'Измените значения согласно данным продукта.<br>'
            '<em>Все значения указываются на 100г продукта.</em><br>'
            '<small>Формат: JSON. Не удаляйте структуру, только изменяйте значения.</small><br>'
            '<a href="/static/admin/nutritional_info_guide.html" target="_blank" style="color: #0066cc;">📖 Подробное руководство по заполнению</a>'
        )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ('name', 'manufacturer', 'category', 'price', 'stock_quantity', 'is_active', 'created_at')
    list_filter = ('category', 'manufacturer', 'is_active', 'is_gluten_free', 'is_low_protein', 'is_lactose_free', 'is_egg_free')
    search_fields = ('name', 'description', 'manufacturer', 'composition')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'description', 'category', 'price')
        }),
        ('Производитель и состав', {
            'fields': ('manufacturer', 'composition', 'storage_conditions'),
            'description': 'Информация о производителе, составе и условиях хранения'
        }),
        ('Характеристики', {
            'fields': ('is_gluten_free', 'is_low_protein', 'stock_quantity', 'is_active', 'is_lactose_free', 'is_egg_free')
        }),
        ('Пищевая ценность', {
            'fields': ('nutritional_info',),
            'description': 'Подробная информация о пищевой ценности продукта'
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')