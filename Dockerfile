# ==============================================================================
# Astraiv Technologies — Admin Dashboard Production Multi-Stage Dockerfile
# ==============================================================================
# Node.js 22 LTS on Debian Bookworm Slim for glibc, OpenSSL 3, & Prisma 7 parity.
# Multi-stage architecture:
#   1. base: System dependencies (OpenSSL 3, CA certificates)
#   2. deps: Clean reproducible npm ci
#   3. builder: Offline Prisma generation & standalone Next.js compilation
#   4. runner: Minimal, hardened non-root container with healthcheck
# ==============================================================================

# --- Stage 1: Base System ---
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# --- Stage 2: Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 3: Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment configuration
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
# Safe offline fallback for DATABASE_URL during static generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/astraiv_db"

# Public build arguments with safe fallbacks (never pass secrets as ARGs)
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ARG NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# --- Stage 4: Minimal Production Runner ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Install curl for container health check and CA certificates for TLS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Hardened non-root user setup (UID 1001)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

# Docker native healthcheck hitting the dedicated /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:3001/api/health || exit 1

# Graceful signal-handling execution
CMD ["node", "server.js"]
