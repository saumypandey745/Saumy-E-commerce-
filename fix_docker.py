import os
import yaml

with open('docker-compose.yml', 'r') as f:
    data = yaml.safe_load(f)

for service_name, service_data in data['services'].items():
    if service_name in ['auth-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'search-service', 'review-service', 'ai-service']:
        if 'build' in service_data and isinstance(service_data['build'], str):
            old_path = service_data['build']
            service_data['build'] = {
                'context': '.',
                'dockerfile': f'{old_path}/Dockerfile'
            }

with open('docker-compose.yml', 'w') as f:
    yaml.dump(data, f, sort_keys=False)

