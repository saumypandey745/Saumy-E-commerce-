FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY microservices/shared ./microservices/shared
COPY microservices/payment-service ./microservices/payment-service
RUN npm install
# Since we are using npm workspaces, npm install from root works best.

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/microservices/shared ./microservices/shared
COPY --from=builder /app/microservices/payment-service ./microservices/payment-service
WORKDIR /app/microservices/payment-service
ENV NODE_ENV=production
CMD ["npm", "start"]
