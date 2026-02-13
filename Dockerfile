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

# Install production-only backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev

# Copy backend source (excluding seeders, .env, dev-only files)
COPY backend/server.js ./server.js
COPY backend/config/ ./config/
COPY backend/middleware/ ./middleware/
COPY backend/models/ ./models/
COPY backend/routes/ ./routes/

# Copy built frontend into backend's public directory
COPY --from=frontend-build /app/frontend/build ./public

# Create uploads directory
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["dumb-init", "node", "server.js"]
