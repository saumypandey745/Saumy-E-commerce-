FROM node:18-alpine
WORKDIR /app

# Copy root workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared library
COPY microservices/shared ./microservices/shared

# Copy the service
COPY microservices/promotion-service ./microservices/promotion-service

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --ignore-scripts --filter @ecommerce/promotion-service...

WORKDIR /app/microservices/promotion-service
EXPOSE 8012

CMD ["pnpm", "start"]
