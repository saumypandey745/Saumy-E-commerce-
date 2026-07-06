const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const fs = require('fs');
const path = require('path');

const services = [
    { name: 'auth-service', port: 8001 },
    { name: 'product-service', port: 8003 },
    { name: 'order-service', port: 8004 },
    { name: 'payment-service', port: 8006 },
    { name: 'cart-service', port: 8007 },
    { name: 'review-service', port: 8009 }
];

async function generateAll() {
    for (const service of services) {
        const doc = {
            info: {
                title: `${service.name} API`,
                description: `Automatically generated OpenAPI spec for ${service.name}`
            },
            host: `localhost:${service.port}`,
            basePath: `/api/v1`
        };

        const outputFile = path.join(__dirname, `../microservices/${service.name}/src/openapi.json`);
        const endpointsFiles = [path.join(__dirname, `../microservices/${service.name}/src/index.js`)];

        console.log(`Generating Swagger for ${service.name}...`);
        await swaggerAutogen(outputFile, endpointsFiles, doc);
        console.log(`Successfully generated ${outputFile}`);
    }
}

generateAll().catch(console.error);
