# ==============================================================================
# MEDSZOP BACKEND — PRODUCTION & STAGING MULTI-STAGE DOCKERFILE
# ==============================================================================
# Security & Operational Standards:
# - Multi-stage build to minimize image size and attack surface
# - Pinned LTS Alpine base image (node:22-alpine)
# - Runs as an unprivileged non-root user (nodejs:nodejs, UID 1001)
# - Native container health check via /health endpoint
# - Graceful shutdown signal propagation (SIGTERM / SIGINT)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation
# ------------------------------------------------------------------------------
FROM node:22-alpine AS dependencies

WORKDIR /app

# Install build dependencies for native modules if required
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

# Install production-only dependencies cleanly
RUN npm ci --omit=dev && npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 2: Runtime Production Image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Security: Create non-root group and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set production environment defaults
ENV NODE_ENV=production \
    PORT=5000

# Copy installed production dependencies from builder stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy backend application source code
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs config/ ./config/
COPY --chown=nodejs:nodejs controllers/ ./controllers/
COPY --chown=nodejs:nodejs middleware/ ./middleware/
COPY --chown=nodejs:nodejs models/ ./models/
COPY --chown=nodejs:nodejs routes/ ./routes/
COPY --chown=nodejs:nodejs utils/ ./utils/

# Create uploads directory structure and assign ownership to non-root user
RUN mkdir -p /app/uploads/prescriptions && \
    chown -R nodejs:nodejs /app/uploads

# Switch to unprivileged non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Container Healthcheck (Liveness probe every 30s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start server
CMD ["node", "server.js"]

