# Base image
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci 

# Build stage
FROM base AS build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
