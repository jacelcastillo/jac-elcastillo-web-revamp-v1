#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

until [ -f wp-config.php ]; do sleep 2; done
until wp db check >/dev/null 2>&1; do sleep 2; done

if ! wp core is-installed 2>/dev/null; then
  wp core install \
    --url=http://localhost:8081 \
    --title="JAC El Castillo web local" \
    --admin_user=admin \
    --admin_password=admin-local \
    --admin_email=admin@example.invalid \
    --skip-email
fi

wp option update timezone_string America/Bogota
wp rewrite structure '/%postname%/' --hard
wp plugin activate jac-el-castillo-web

wp eval-file /dev-scripts/datos-prueba.php
