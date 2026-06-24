const { createClient } = require('redis');

let subscriber;
const eventQueue = [];

const connectRedis = async () => {
    subscriber = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

    await subscriber.connect();
    
    // Subscribe to Gateway Access Logs and Security Alerts
    await subscriber.subscribe('telemetry:gateway_logs', (message) => {
        eventQueue.push({ type: 'GATEWAY_LOG', data: JSON.parse(message) });
    });
    
    await subscriber.subscribe('telemetry:security_alerts', (message) => {
        eventQueue.push({ type: 'SECURITY_ALERT', data: JSON.parse(message) });
    });

    console.log('Redis Subscribed to telemetry channels');
};

const getRecentEvents = () => {
    const events = [...eventQueue];
    eventQueue.length = 0; // Clear after reading
    return events;
};

module.exports = { connectRedis, getRecentEvents };
