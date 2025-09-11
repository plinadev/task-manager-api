# -------------------
# Build stage
# -------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Run migrations
RUN npm run typeorm migration:run -- -d typeorm.config.ts

# -------------------
# Production stage
# -------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy compiled app and runtime dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
