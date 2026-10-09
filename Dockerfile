# Multi-stage Dockerfile for Bun + Fastify + React (Vite)

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build frontend (React + Vite)
RUN bun run build

# Stage 3: Production
FROM oven/bun:1-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4095
ENV HOST=0.0.0.0

# Copy package files for production install
COPY package.json bun.lock ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server.ts ./
COPY src/server ./src/server

# Expose port
EXPOSE 4095

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health').then(r=>r.ok&&process.exit(0)).catch(()=>process.exit(1))"

# Start the server
CMD ["bun", "server.ts"]
