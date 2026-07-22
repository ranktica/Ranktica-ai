# ==========================================
# Stage 1: Build Phase
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all packages including devDependencies
RUN npm ci

# Copy core source files
COPY . .

# Run production build compilation
RUN npm run build

# ==========================================
# Stage 2: Minimalist Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Establish secure environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only critical production dependencies
RUN npm ci --only=production

# Avoid running container processes as root user
USER node

# Expose system egress port (3000 for container networking)
EXPOSE 3000

# Boot the compiled standalone CJS Express server bundle
CMD ["node", "dist/server.cjs"]
