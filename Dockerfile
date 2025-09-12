# -------------------
# Build stage
# -------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -------------------
# Production stage
# -------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "npm run typeorm migration:run -- -d dist/typeorm.config.js && node dist/src/main.js"]
