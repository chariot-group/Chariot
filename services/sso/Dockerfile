FROM quay.io/keycloak/keycloak:26.6

# Build optimized Keycloak image with postgres support
RUN /opt/keycloak/bin/kc.sh build \
    --db=postgres \
    --health-enabled=true \
    --metrics-enabled=true \
    --http-relative-path=/auth

# Set working directory
WORKDIR /opt/keycloak

# Expose port
EXPOSE 8080

# Default command (can be overridden in docker-compose)
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
