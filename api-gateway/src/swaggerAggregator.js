const packageJson = require('../package.json');

const getAggregatedSwagger = async () => {
    const swaggerDoc = {
        openapi: '3.0.0',
        info: {
            title: 'Enterprise E-Commerce API',
            version: packageJson.version,
            description: 'Centralized API Gateway documentation aggregating all microservices automatically.'
        },
        servers: [
            { url: '/api/v1', description: 'API Gateway (v1)' }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ BearerAuth: [] }],
        paths: {}
    };

    // Find all service URLs in the environment
    const serviceUrls = Object.keys(process.env)
        .filter(key => key.endsWith('_SERVICE_URL'))
        .map(key => process.env[key]);

    // Fetch /openapi.json from all downstream services
    const fetchPromises = serviceUrls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(`${url}/openapi.json`, { signal: controller.signal });
            clearTimeout(timeout);
            
            if (res.ok) {
                const data = await res.json();
                if (data && data.paths) {
                    // Merge paths
                    for (const [path, methods] of Object.entries(data.paths)) {
                        swaggerDoc.paths[path] = methods;
                    }
                    // Merge components/schemas if they exist
                    if (data.components && data.components.schemas) {
                        if (!swaggerDoc.components.schemas) swaggerDoc.components.schemas = {};
                        for (const [schemaName, schemaObj] of Object.entries(data.components.schemas)) {
                            swaggerDoc.components.schemas[schemaName] = schemaObj;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`[Swagger Aggregator] Failed to fetch openapi.json from ${url}: ${error.message}`);
        }
    });

    await Promise.all(fetchPromises);
    
    return swaggerDoc;
};

module.exports = { getAggregatedSwagger };
