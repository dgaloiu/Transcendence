FROM nginx:alpine

USER root

# Install openssl to generate self-signed certificates
RUN apk --no-cache add openssl

# Copy nginx configuration file
COPY ./conf/nginx.conf.template /etc/nginx/conf.d/

# Copy the initialization script to the docker-entrypoint directory
COPY ./conf/init.sh /docker-entrypoint.d/

# Make the initialization script executable
RUN chmod +x /docker-entrypoint.d/init.sh
