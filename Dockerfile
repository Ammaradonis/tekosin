# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm run build

# ── Stage 2: Production backend + static frontend ───────────────────────────
FROM node:18-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend's expected path
COPY --from=frontend-build /app/frontend/build ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Use dumb-init for proper signal handling
CMD ["dumb-init", "node", "server.js"]
