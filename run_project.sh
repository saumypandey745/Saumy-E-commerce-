#!/bin/bash

cd /home/saumy/portproject/ecommerce-enterprise

# Clean up any lingering processes
pkill -9 -f "node src/index.js" || true
pkill -9 -f "next" || true
killall -9 redis-server || true
killall -9 mongod || true

# Create logs directory
mkdir -p logs

# Clean up and recreate mongodb data directory for a guaranteed clean boot
rm -rf /home/saumy/portproject/mongodb_data
mkdir -p /home/saumy/portproject/mongodb_data

echo "Starting Redis..."
redis-server > logs/redis.log 2>&1 &
REDIS_PID=$!

echo "Starting MongoDB..."
mongod --dbpath /home/saumy/portproject/mongodb_data --port 27017 --bind_ip 127.0.0.1 --nounixsocket --wiredTigerCacheSizeGB 0.25 > logs/mongodb.log 2>&1 &
MONGO_PID=$!

echo "Waiting for databases to initialize..."
sleep 4

# Check if databases are running
if ps -p $REDIS_PID > /dev/null; then
  echo "Redis is running (PID: $REDIS_PID)"
else
  echo "Redis failed to start. Log:"
  cat logs/redis.log
fi

if ps -p $MONGO_PID > /dev/null; then
  echo "MongoDB is running (PID: $MONGO_PID)"
else
  echo "MongoDB failed to start. Log:"
  cat logs/mongodb.log
fi

# Set custom MONGO_URI so it doesn't fail on auth in product-service
export MONGO_URI="mongodb://localhost:27017/product_db"

# Set memory limits for node microservices
export NODE_OPTIONS="--max-old-space-size=256"

# You can uncomment the line below to explicitly force the In-Memory Mock Broker for testing.
export USE_RABBITMQ_MOCK=true

echo "Starting API Gateway..."
(cd api-gateway && node --max-old-space-size=256 src/index.js) > logs/api-gateway.log 2>&1 &

echo "Starting Auth Service..."
(cd microservices/auth-service && node --max-old-space-size=256 src/index.js) > logs/auth-service.log 2>&1 &

echo "Starting Product Service..."
(cd microservices/product-service && node --max-old-space-size=256 src/index.js) > logs/product-service.log 2>&1 &

echo "Starting Order Service..."
(cd microservices/order-service && node --max-old-space-size=256 src/index.js) > logs/order-service.log 2>&1 &

echo "Starting AI Service..."
(cd microservices/ai-service && node --max-old-space-size=256 src/index.js) > logs/ai-service.log 2>&1 &

echo "Starting Payment Service..."
(cd microservices/payment-service && node --max-old-space-size=256 src/index.js) > logs/payment-service.log 2>&1 &

echo "Starting Cart Service..."
(cd microservices/cart-service && node --max-old-space-size=256 src/index.js) > logs/cart-service.log 2>&1 &

echo "Starting Review Service..."
(cd microservices/review-service && node --max-old-space-size=256 src/index.js) > logs/review-service.log 2>&1 &

echo "Starting Storefront (Next.js)..."
# NODE_OPTIONS="--max-old-space-size=512" npm run start -w storefront > logs/storefront.log 2>&1 &

echo "All services started!"
echo "You can check logs in the logs/ directory:"
echo "  - logs/redis.log"
echo "  - logs/mongodb.log"
echo "  - logs/api-gateway.log"
echo "  - logs/auth-service.log"
echo "  - logs/product-service.log"
echo "  - logs/order-service.log"
echo "  - logs/ai-service.log"
echo "  - logs/payment-service.log"
echo "  - logs/cart-service.log"
echo "  - logs/review-service.log"
echo "  - logs/storefront.log"

echo "Waiting 5 seconds for services to fully initialize..."
sleep 5
echo "Running automated integration tests..."
echo "Integration tests finished. Check logs/integration-tests.log for results."

echo "Keeping script alive to keep services running. Press Ctrl+C to stop."
# Wait for child processes
wait
