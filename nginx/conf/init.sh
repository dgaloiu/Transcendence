#!/bin/sh

# Create SSL certificate
mkdir -p /etc/nginx/ssl/
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" \
    -keyout /etc/nginx/ssl/cert.key -out /etc/nginx/ssl/cert.crt

# Replace placeholders in the nginx template
envsubst '${FRONTEND_PORT} ${BACKEND_PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
