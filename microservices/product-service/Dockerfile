FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY microservices/shared ./microservices/shared
COPY microservices/product-service ./microservices/product-service
RUN npm install -g pnpm && pnpm install
# Since we are using npm workspaces, npm install from root works best.

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/microservices/shared ./microservices/shared
COPY --from=builder /app/microservices/product-service ./microservices/product-service
WORKDIR /app/microservices/product-service
ENV NODE_ENV=production
CMD ["npm", "start"]
