# =============================================================================
# Multi-stage Dockerfile for Powerhouse Document Model Packages
# Produces two images: connect (frontend) and switchboard (backend)
#
# Build commands:
#   docker build --target connect -t <registry>/<project>/connect:<tag> .
#   docker build --target switchboard -t <registry>/<project>/switchboard:<tag> .
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage: Common setup for building
# -----------------------------------------------------------------------------
FROM node:24-alpine AS base

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git bash openssl \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Configure JSR registry
RUN pnpm config set @jsr:registry https://npm.jsr.io

# Build arguments
ARG PH_CONNECT_BASE_PATH="/"

# Install prisma and prettier globally
RUN pnpm add -g prisma@5.17.0 prettier

WORKDIR /app/project

# Copy all project files
COPY package.json pnpm-lock.yaml ./
COPY powerhouse.manifest.json powerhouse.config.json ./
COPY tsconfig*.json vite.config.ts vitest.config.ts eslint.config.js ./
COPY document-models/ ./document-models/
COPY editors/ ./editors/
COPY processors/ ./processors/
COPY subgraphs/ ./subgraphs/
COPY scripts/ ./scripts/
COPY index.ts index.html style.css ./

# Install dependencies
RUN pnpm install

# Build the project
RUN pnpm build

# Regenerate Prisma client for Alpine Linux
RUN prisma generate --schema node_modules/document-drive/dist/prisma/schema.prisma || true

# -----------------------------------------------------------------------------
# Connect build stage
# -----------------------------------------------------------------------------
FROM base AS connect-builder

ARG PH_CONNECT_BASE_PATH="/"

# Build connect
RUN pnpm run connect build --base ${PH_CONNECT_BASE_PATH}

# -----------------------------------------------------------------------------
# Connect final stage - nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS connect

# Install envsubst for config templating
RUN apk add --no-cache gettext

# Copy nginx config template
COPY docker/nginx.conf /etc/nginx/nginx.conf.template

# Copy built static files from build stage
COPY --from=connect-builder /app/project/.ph/connect-build/dist /var/www/html/project

# Environment variables for nginx config
ENV PORT=3001
ENV PH_CONNECT_BASE_PATH="/"

# Copy and setup entrypoint
COPY docker/connect-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

# -----------------------------------------------------------------------------
# Switchboard final stage - node runtime
# -----------------------------------------------------------------------------
FROM node:24-alpine AS switchboard

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl openssl

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Configure JSR registry
RUN pnpm config set @jsr:registry https://npm.jsr.io

# Install prisma globally (needed for migrations)
RUN pnpm add -g prisma@5.17.0

# Copy built project from build stage
COPY --from=base /app/project /app/project

WORKDIR /app/project

# Copy entrypoint
COPY docker/switchboard-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=""
ENV SKIP_DB_MIGRATIONS="false"

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -so /dev/null http://localhost:${PORT}/graphql || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
