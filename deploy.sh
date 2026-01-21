#!/bin/bash

# Deployment script for pkubg.ru production environment

set -e

echo "🚀 Starting deployment for pkubg.ru..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with production settings"
    exit 1
fi

# Copy production environment
echo "📋 Setting up production environment..."
cp .env.production .env

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# Collect static files
echo "📦 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Create superuser if needed (optional)
echo "👤 Creating superuser (if needed)..."
docker-compose -f docker-compose.prod.yml exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@pkubg.ru', 'admin_password_change_me')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Check services status
echo "🔍 Checking services status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo "🌐 Site should be available at: https://pkubg.ru"
echo ""
echo "📝 Next steps:"
echo "1. Configure SSL certificates in ./ssl/ directory"
echo "2. Update DNS records to point to this server"
echo "3. Change default superuser password"
echo "4. Configure email settings in .env.production"
echo "5. Set up monitoring and backups"