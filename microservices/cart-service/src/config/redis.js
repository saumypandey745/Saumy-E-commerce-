const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await redisClient.connect();
        console.log('Cart Redis Connected');
    } catch (error) {
        console.error(`Redis Connection Error: ${error.message}`);
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
