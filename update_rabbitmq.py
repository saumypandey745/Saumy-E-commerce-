import os

SERVICES = {
    'product-service': 'Product Service',
    'search-service': 'Search Service',
    'order-service': 'Order Service',
    'review-service': 'Review Service',
    'payment-service': 'Payment Service'
}

TEMPLATE = """const amqp = require('amqplib');
const mockBroker = require('@ecommerce/shared/eventBus');

let channel = null;
let activeMode = 'rabbitmq';

const connectRabbitMQ = async () => {
    const useMock = process.env.USE_RABBITMQ_MOCK === 'true';

    if (process.env.NODE_ENV === 'production') {
        try {
            const amqpUrl = process.env.RABBITMQ_URL || 'amqp://admin:adminpassword@localhost:5672';
            const connection = await amqp.connect(amqpUrl);
            channel = await connection.createChannel();
            await channel.assertExchange('ecommerce_events', 'topic', { durable: true });
            console.log('[__SERVICE_NAME__] RabbitMQ connected successfully.');
            activeMode = 'rabbitmq';
        } catch (error) {
            console.error('[__SERVICE_NAME__] RabbitMQ unavailable – exiting.');
            process.exit(1);
        }
    } else {
        if (useMock) {
            console.info('[__SERVICE_NAME__] Running with In-Memory Mock Broker (forced).');
            channel = mockBroker;
            activeMode = 'mock';
        } else {
            try {
                const amqpUrl = process.env.RABBITMQ_URL || 'amqp://admin:adminpassword@localhost:5672';
                const connection = await amqp.connect(amqpUrl);
                channel = await connection.createChannel();
                await channel.assertExchange('ecommerce_events', 'topic', { durable: true });
                console.log('[__SERVICE_NAME__] RabbitMQ connected successfully.');
                activeMode = 'rabbitmq';
            } catch (error) {
                console.warn('[__SERVICE_NAME__] Real RabbitMQ unavailable – falling back to mock.');
                channel = mockBroker;
                activeMode = 'mock';
            }
        }
    }
};

const publishEvent = (routingKey, message) => {
    if (!channel) {
        console.error('[__SERVICE_NAME__] RabbitMQ channel not initialized');
        return;
    }
    channel.publish('ecommerce_events', routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true
    });
};

const getChannel = () => {
    if (!channel) {
        console.warn('[__SERVICE_NAME__] Returning MOCKED RabbitMQ channel (lazy init)');
        return mockBroker;
    }
    return channel;
};

const getBrokerMode = () => activeMode;

module.exports = { connectRabbitMQ, publishEvent, getChannel, getBrokerMode };
"""

for service_id, service_name in SERVICES.items():
    path = f'/home/saumy/portproject/ecommerce-enterprise/microservices/{service_id}/src/config/rabbitmq.js'
    if os.path.exists(path):
        with open(path, 'w') as f:
            f.write(TEMPLATE.replace('__SERVICE_NAME__', service_name))
        print(f"Updated {path}")
    else:
        print(f"File not found: {path}")

