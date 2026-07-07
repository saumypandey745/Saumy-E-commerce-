import yaml

services = []

node_services = [
    ("ecommerce-api-gateway", "api-gateway", "node api-gateway/src/index.js"),
    ("ecommerce-auth-service", "@ecommerce/auth-service", "node microservices/auth-service/src/index.js"),
    ("ecommerce-product-service", "@ecommerce/product-service", "node microservices/product-service/src/index.js"),
    ("ecommerce-order-service", "@ecommerce/order-service", "node microservices/order-service/src/index.js"),
    ("ecommerce-cart-service", "@ecommerce/cart-service", "node microservices/cart-service/src/index.js"),
    ("ecommerce-payment-service", "@ecommerce/payment-service", "node microservices/payment-service/src/index.js"),
    ("ecommerce-review-service", "@ecommerce/review-service", "node microservices/review-service/src/index.js"),
    ("ecommerce-search-service", "search-service", "node microservices/search-service/src/index.js"),
    ("ecommerce-ai-service", "@ecommerce/ai-service", "node microservices/ai-service/src/index.js"),
    ("ecommerce-monitoring-service", "monitoring-service", "node microservices/monitoring-service/src/index.js")
]

for name, filter_name, start_cmd in node_services:
    svc = {
        "type": "web",
        "name": name,
        "env": "node",
        "plan": "free",
        "buildCommand": f"npm install -g pnpm@9 && pnpm install --no-frozen-lockfile --filter {filter_name} --config.ignore-scripts=true",
        "startCommand": start_cmd,
        "healthCheckPath": "/health",
        "envVars": [
            {"key": "NODE_ENV", "value": "production"},
            {"key": "NODE_VERSION", "value": "20.10.0"},
            {"key": "PNPM_VERSION", "value": "9.4.0"}
        ]
    }
    # Gateway needs to know all URLs
    if name == "ecommerce-api-gateway":
        svc["buildCommand"] = "npm install -g pnpm@9 && pnpm install --no-frozen-lockfile --filter api-gateway --config.ignore-scripts=true"
        for n, f, s in node_services:
            if n != "ecommerce-api-gateway":
                env_key = n.replace("ecommerce-", "").replace("-service", "").upper() + "_SERVICE_URL"
                svc["envVars"].append({"key": env_key, "value": f"https://{n}.onrender.com"})
        
        svc["envVars"].append({"key": "AIML_SERVICE_URL", "value": "https://ecommerce-aiml-service.onrender.com"})
        svc["envVars"].append({"key": "PORT", "value": "8000"})
        svc["envVars"].append({"key": "REDIS_URL", "sync": False})
        svc["envVars"].append({"key": "JWT_SECRET", "sync": False})

    if name == "ecommerce-auth-service":
        svc["envVars"].append({"key": "DB_URI", "sync": False})
        svc["envVars"].append({"key": "JWT_SECRET", "sync": False})
    
    if name == "ecommerce-product-service":
        svc["envVars"].append({"key": "MONGO_URI", "sync": False})
        svc["envVars"].append({"key": "REDIS_URL", "sync": False})
        svc["envVars"].append({"key": "ELASTICSEARCH_URL", "sync": False})

    if name == "ecommerce-cart-service":
        svc["envVars"].append({"key": "REDIS_URL", "sync": False})

    if name == "ecommerce-order-service":
        svc["envVars"].append({"key": "DATABASE_URL", "sync": False})
        svc["envVars"].append({"key": "RABBITMQ_URL", "sync": False})
    
    if name == "ecommerce-payment-service":
        svc["envVars"].append({"key": "DATABASE_URL", "sync": False})
        svc["envVars"].append({"key": "RABBITMQ_URL", "sync": False})
        
    if name == "ecommerce-search-service":
        svc["envVars"].append({"key": "ELASTICSEARCH_URL", "sync": False})
        svc["envVars"].append({"key": "RABBITMQ_URL", "sync": False})

    if name == "ecommerce-review-service":
        svc["envVars"].append({"key": "DATABASE_URL", "sync": False})
        svc["envVars"].append({"key": "RABBITMQ_URL", "sync": False})

    services.append(svc)

# add ai-ml-service
services.append({
    "type": "web",
    "name": "ecommerce-aiml-service",
    "env": "python",
    "plan": "free",
    "buildCommand": "pip install -r requirements.txt",
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "rootDir": "microservices/ai-ml-service",
    "healthCheckPath": "/health",
    "envVars": [
        {"key": "PYTHON_VERSION", "value": "3.10.0"}
    ]
})

with open("render.yaml", "w") as f:
    yaml.dump({"services": services}, f, sort_keys=False)
