const amqp = require('amqplib');
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
            console.log('[Product Service] RabbitMQ connected successfully.');
            activeMode = 'rabbitmq';
        } catch (error) {
            console.error('[Product Service] RabbitMQ unavailable – exiting.');
            process.exit(1);
        }
    } else {
        if (useMock) {
            console.info('[Product Service] Running with In-Memory Mock Broker (forced).');
            channel = mockBroker;
            activeMode = 'mock';
        } else {
            try {
                const amqpUrl = process.env.RABBITMQ_URL || 'amqp://admin:adminpassword@localhost:5672';
                const connection = await amqp.connect(amqpUrl);
                channel = await connection.createChannel();
                await channel.assertExchange('ecommerce_events', 'topic', { durable: true });
                console.log('[Product Service] RabbitMQ connected successfully.');
                activeMode = 'rabbitmq';
            } catch (error) {
                console.warn('[Product Service] Real RabbitMQ unavailable – falling back to mock.');
                channel = mockBroker;
                activeMode = 'mock';
            }
        }
    }
};

const publishEvent = (routingKey, message) => {
    if (!channel) {
        console.error('[Product Service] RabbitMQ channel not initialized');
        return;
    }
    channel.publish('ecommerce_events', routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true
    });
};

const getChannel = () => {
    if (!channel) {
        console.warn('[Product Service] Returning MOCKED RabbitMQ channel (lazy init)');
        return mockBroker;
    }
    return channel;
};

const getBrokerMode = () => activeMode;

module.exports = { connectRabbitMQ, publishEvent, getChannel, getBrokerMode };
