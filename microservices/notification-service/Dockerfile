FROM node:18-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY microservices/shared ./microservices/shared
COPY microservices/notification-service ./microservices/notification-service

RUN npm install -g pnpm
RUN pnpm install --ignore-scripts --filter @ecommerce/notification-service...

WORKDIR /app/microservices/notification-service
CMD ["pnpm", "start"]
