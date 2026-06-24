#!/bin/bash
# Enterprise Scale Bulk Import and Indexing Script

echo "====================================================="
echo " Enterprise Catalog Initialization "
echo "====================================================="

# Step 1: Start the Database Infrastructure
echo "[1/4] Booting up MongoDB, Redis, RabbitMQ, and Elasticsearch..."
docker-compose up -d mongo redis rabbitmq elasticsearch
echo "Waiting for services to become healthy..."
sleep 15

# Helper function to run node scripts in a temporary container attached to the network
run_node_script() {
    docker run --rm --network ecommerce-enterprise_ecommerce-network \
        -v $(pwd):/app -w /app node:18 \
        bash -c "cd microservices/product-service && npm install && cd ../../ && MONGO_URI=mongodb://mongo:27017/ecommerce_products ELASTICSEARCH_URL=http://elasticsearch:9200 node \$1"
}

# Step 2: Create MongoDB Indexes
echo "[2/4] Applying database indexes for millions of records..."
run_node_script "scripts/enterprise_seed/create_indexes.js"

# Step 3: Run Seed Generation
# Usage: ./bulk_import.sh [size]
# Default is 10000 for performance testing
SIZE=${1:-5000}
echo "[3/4] Generating and inserting $SIZE products into MongoDB..."
run_node_script "scripts/enterprise_seed/seed_catalog.js $SIZE"

# Step 4: Sync to Elasticsearch
echo "[4/4] Synchronizing MongoDB catalog to Elasticsearch for fast text search..."
run_node_script "scripts/enterprise_seed/sync_mongo_to_es.js"

echo "====================================================="
echo " ✅ Bulk Import Complete!"
echo " The system is now ready to handle enterprise traffic."
echo " Start the API Gateway and frontend using: docker-compose up -d"
echo "====================================================="
