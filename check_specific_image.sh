#!/bin/bash
# Скрипт для проверки конкретного изображения
# Использование: bash check_specific_image.sh 8784016894.png

IMAGE_NAME="${1:-8784016894.png}"
PROJECT_PATH=""  # ИЗМЕНИТЕ НА ВАШ ПУТЬ

echo "=========================================="
echo "Проверка изображения: $IMAGE_NAME"
echo "=========================================="

echo ""
echo "=== 1. Поиск файла в media/products ==="
if [ -f "$PROJECT_PATH/media/products/$IMAGE_NAME" ]; then
    echo "✓ Файл найден: $PROJECT_PATH/media/products/$IMAGE_NAME"
    ls -lh "$PROJECT_PATH/media/products/$IMAGE_NAME"
    
    echo ""
    echo "Размер файла:"
    du -h "$PROJECT_PATH/media/products/$IMAGE_NAME"
    
    echo ""
    echo "Права доступа:"
    stat "$PROJECT_PATH/media/products/$IMAGE_NAME" | grep -E "Access|Uid|Gid"
    
    echo ""
    echo "Тип файла:"
    file "$PROJECT_PATH/media/products/$IMAGE_NAME"
else
    echo "✗ Файл НЕ найден: $PROJECT_PATH/media/products/$IMAGE_NAME"
fi

echo ""
echo "=== 2. Поиск файла во всей директории media ==="
find "$PROJECT_PATH/media" -name "$IMAGE_NAME" -type f 2>/dev/null

echo ""
echo "=== 3. Поиск похожих файлов ==="
BASE_NAME="${IMAGE_NAME%.*}"
echo "Ищем файлы с именем: ${BASE_NAME}*"
find "$PROJECT_PATH/media/products" -name "${BASE_NAME}*" -type f 2>/dev/null

echo ""
echo "=== 4. Проверка в базе данных ==="
cd "$PROJECT_PATH"
if [ -d "venv" ]; then
    source venv/bin/activate
    python manage.py shell -c "
from products.models import ProductImage
import os
from django.conf import settings

# Поиск по имени файла
images = ProductImage.objects.filter(image__icontains='$BASE_NAME')
print(f'Найдено изображений с именем {BASE_NAME}: {images.count()}')

for img in images:
    print(f'\nID: {img.id}')
    print(f'  Product: {img.product.name}')
    print(f'  Image path: {img.image.name}')
    print(f'  Image URL: {img.image.url}')
    
    full_path = os.path.join(settings.MEDIA_ROOT, img.image.name)
    exists = os.path.exists(full_path)
    print(f'  File exists: {exists}')
    
    if exists:
        size = os.path.getsize(full_path)
        print(f'  File size: {size} bytes')
    else:
        print(f'  Expected path: {full_path}')
" 2>&1
    deactivate
else
    echo "Виртуальное окружение не найдено"
fi

echo ""
echo "=== 5. Тест доступа через curl ==="
echo "Тест URL: https://pkubg.ru/media/products/$IMAGE_NAME"
curl -I "https://pkubg.ru/media/products/$IMAGE_NAME" 2>&1 | head -10

echo ""
echo "=== 6. Проверка логов nginx ==="
echo "Последние запросы к этому файлу:"
sudo tail -100 /var/log/nginx/access.log 2>/dev/null | grep "$IMAGE_NAME" | tail -5 || echo "Нет запросов"

echo ""
echo "Ошибки nginx для этого файла:"
sudo tail -100 /var/log/nginx/error.log 2>/dev/null | grep "$IMAGE_NAME" | tail -5 || echo "Нет ошибок"

echo ""
echo "=== 7. Проверка логов gunicorn ==="
echo "Последние упоминания файла в логах:"
sudo journalctl -u gunicorn -n 200 --no-pager 2>/dev/null | grep -i "$BASE_NAME" | tail -10 || echo "Нет упоминаний"

echo ""
echo "=========================================="
echo "Проверка завершена"
echo "=========================================="
