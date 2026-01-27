# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
COPY package*.json ./
RUN npm ci
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json server/nest-cli.json ./
COPY server/src ./src
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend build and production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy built backend
COPY --from=backend-build /app/server/dist ./dist

# Copy built frontend to dist folder (served by NestJS)
COPY --from=frontend-build /app/dist /app/dist

WORKDIR /app/server

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/main.js"]
