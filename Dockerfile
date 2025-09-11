# -------------------
# Build stage
# -------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# -------------------
# Production stage
# -------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy everything from builder stage in one go
COPY --from=builder /app/package.json /app/package-lock.json /app/node_modules /app/dist ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
