#!/bin/sh

set -e

echo "Starting Laravel initialization..."

# Vérifier si .env existe, sinon le créer à partir de .env.example
if [ ! -f .env ]; then
    echo ".env file not found, creating from .env.example..."
    cp .env.example .env
    php artisan key:generate --force
else
    echo ".env file already exists, skipping creation."
fi

if ! grep -q '^JWT_SECRET=' .env || [ -z "$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)" ]; then
    echo "JWT_SECRET missing or empty, generating..."
    php artisan jwt:secret --force
else
    echo "JWT_SECRET found in .env."
fi

# Installer les dépendances Composer si nécessaires
if [ ! -d vendor ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
else
    echo "Vendor directory found, skipping composer install."
fi

# Attendre que MySQL soit prêt
echo "Waiting for MySQL to be ready..."
until mysqladmin ping -h"${DB_HOST:-mysql}" -P"${DB_PORT:-3306}" --silent; do
    echo "MySQL not ready yet. Retrying in 2 seconds..."
    sleep 2
done

# Exécuter les migrations si la base de données est accessible
if php artisan migrate:status > /dev/null 2>&1; then
    echo "Running database migrations..."
    php artisan migrate --force
else
    echo "Database not accessible or not configured yet. Skipping migrations."
fi

# Exécuter le serveur Laravel accessible depuis l'extérieur
echo "Starting Laravel server on 0.0.0.0:8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
