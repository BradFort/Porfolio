FROM php:8.4-fpm-alpine

# --- System Dependencies ---
RUN apk add --no-cache \
    git curl zip unzip mysql-client nginx supervisor \
    oniguruma-dev libxml2-dev \
    freetype-dev libpng-dev libjpeg-turbo-dev libwebp-dev \
    libjpeg-turbo libzip-dev

# --- PHP Extensions (GD FIXED for PHP 8.4) ---
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp \
 && docker-php-ext-install gd

# Other PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath zip

# --- Redis Extension ---
RUN apk add --no-cache pcre-dev $PHPIZE_DEPS \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && apk del pcre-dev $PHPIZE_DEPS

# --- PHP Upload Config ---
COPY <<EOF /usr/local/etc/php/conf.d/uploads.ini
upload_max_filesize = 10M
post_max_size = 12M
max_execution_time = 60
memory_limit = 256M
EOF

# --- Composer ---
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# --- App Directory ---
WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .

RUN composer dump-autoload --optimize

# --- Permissions ---
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

# --- Nginx config ---
COPY <<EOF /etc/nginx/http.d/default.conf
server {
    listen 8000;
    server_name _;
    root /var/www/public;

    index index.php;

    client_max_body_size 12M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \\.php$ {
        fastcgi_split_path_info ^(.+\\.php)(/.+)$;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param PATH_INFO \$fastcgi_path_info;
        include fastcgi_params;
    }
}
EOF

# --- Supervisor config ---
COPY <<EOF /etc/supervisor/conf.d/laravel.conf
[supervisord]
nodaemon=true

[program:php-fpm]
command=php-fpm --nodaemonize
autostart=true
autorestart=true

[program:nginx]
command=nginx -g 'daemon off;'
autostart=true
autorestart=true

[program:laravel-worker]
command=php /var/www/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stdout_logfile=/var/www/storage/logs/worker.log
EOF

RUN mkdir -p /var/log/supervisor

# --- Start Script ---
COPY <<'EOF' /usr/local/bin/start.sh
#!/bin/sh
set -e
echo "Starting Supervisor (Nginx + PHP-FPM + Workers)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/laravel.conf
EOF
RUN chmod +x /usr/local/bin/start.sh

# --- Entrypoint ---
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/usr/local/bin/start.sh"]

EXPOSE 8000
