import os
import glob

dockerfile_content = """FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY microservices/shared ./microservices/shared
COPY {SERVICE_DIR} ./{SERVICE_DIR}
RUN npm install
# Since we are using npm workspaces, npm install from root works best.

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/microservices/shared ./microservices/shared
COPY --from=builder /app/{SERVICE_DIR} ./{SERVICE_DIR}
WORKDIR /app/{SERVICE_DIR}
ENV NODE_ENV=production
CMD ["npm", "start"]
"""

services = glob.glob('microservices/*-service')
for service in services:
    content = dockerfile_content.replace('{SERVICE_DIR}', service)
    with open(os.path.join(service, 'Dockerfile'), 'w') as f:
        f.write(content)
print("Dockerfiles updated.")
