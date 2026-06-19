const fs = require('fs');
const path = require('path');

const services = [
    'api-gateway',
    'microservices/ai-service',
    'microservices/auth-service',
    'microservices/cart-service',
    'microservices/order-service',
    'microservices/payment-service',
    'microservices/product-service',
    'microservices/review-service',
    'microservices/search-service',
    'microservices/shared'
];

const dockerfileContent = `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["npm", "start"]
`;

const dockerignoreContent = `node_modules
npm-debug.log
.env
.git
.gitignore
Dockerfile
`;

services.forEach(service => {
    const servicePath = path.join(__dirname, '..', service);
    if (fs.existsSync(servicePath)) {
        fs.writeFileSync(path.join(servicePath, 'Dockerfile'), dockerfileContent);
        fs.writeFileSync(path.join(servicePath, '.dockerignore'), dockerignoreContent);
        console.log(`Created Dockerfile for ${service}`);
    }
});

// Next.js Frontend Dockerfile
const nextjsDockerfile = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
`;

const frontends = ['frontend/apps/storefront', 'frontend/apps/admin-dashboard'];
frontends.forEach(fe => {
    const fePath = path.join(__dirname, '..', fe);
    if (fs.existsSync(fePath)) {
        fs.writeFileSync(path.join(fePath, 'Dockerfile'), nextjsDockerfile);
        fs.writeFileSync(path.join(fePath, '.dockerignore'), dockerignoreContent + '\n.next\n');
        console.log(`Created Dockerfile for ${fe}`);
    }
});
