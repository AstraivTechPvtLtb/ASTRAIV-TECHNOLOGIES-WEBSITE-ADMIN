# Astraiv Technologies — Admin Dashboard Docker Guide

This guide documents the Docker containerization setup for the Astraiv Technologies Admin Dashboard (`astraiv-admin`).

---

## 1. Overview & Architecture

- **Base Image:** `node:22-bookworm-slim` (Debian 12 Bookworm with glibc, OpenSSL 3.0, and Node.js 22 LTS)
- **Application Port:** `3001` (internal container port)
- **Host Loopback Binding:** `127.0.0.1:3001`
- **Output Mode:** Next.js 16 Standalone (`output: "standalone"` enabled via `BUILD_STANDALONE=true`)
- **Healthcheck Endpoint:** `GET /api/health`
- **Security:** Hardened non-root execution (`nextjs:nodejs`, UID 1001)

---

## 2. Multi-Stage Build Architecture

1. **`base` Stage:** Installs `openssl`, `ca-certificates`, and `curl` for Prisma PostgreSQL TLS connectivity and Docker health checks.
2. **`deps` Stage:** Runs `npm ci` reproducibly against `package-lock.json`.
3. **`builder` Stage:**
   - Runs `prisma generate` to compile Prisma Client v7.
   - Compiles Next.js 16 with `BUILD_STANDALONE=true` and inlines public build arguments.
   - Falls back safely to offline database URLs during static page pre-rendering.
4. **`runner` Stage:**
   - Minimal runtime image.
   - Copies `public/` assets, `prisma/` schema, `.next/static/` bundles, and `.next/standalone/`.
   - Runs as non-root user `nextjs`.
   - Starts via `CMD ["node", "server.js"]` for graceful signal handling.

---

## 3. Environment Variables

Create `.env.docker` from `.env.docker.example`:

```bash
cp .env.docker.example .env.docker
```

Never commit `.env.docker` to version control. The file is listed in `.gitignore` and `.dockerignore`.

---

## 4. Commands

### Build Image Independently

```bash
docker build -t astraiv-admin:latest .
```

To supply custom public build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="http://localhost:3001" \
  --build-arg NEXT_PUBLIC_CLIENT_URL="http://localhost:3000" \
  -t astraiv-admin:latest .
```

### Run Container Independently

```bash
docker run -d \
  --name astraiv-admin \
  -p 127.0.0.1:3001:3001 \
  --env-file .env.docker \
  --restart unless-stopped \
  astraiv-admin:latest
```

### Container Status & Logs

```bash
docker ps -f name=astraiv-admin
docker logs -f astraiv-admin
```

### Verify Container Health & Auth Guards

```bash
# Run local smoke verification
npm run test:container
# or via curl
curl -f http://127.0.0.1:3001/api/health
```

### Stop & Remove Container

```bash
docker stop astraiv-admin
docker rm astraiv-admin
```
