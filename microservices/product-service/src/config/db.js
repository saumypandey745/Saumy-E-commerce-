const mongoose = require('mongoose');
const { createClient } = require('redis');

const connectDB = async (retries = 10, delay = 3000) => {
    for (let i = 1; i <= retries; i++) {
        try {
            const mongoUri = process.env.MONGO_URI || 'mongodb://admin:adminpassword@localhost:27017/product_db?authSource=admin';
            await mongoose.connect(mongoUri, {
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true
});
            console.log('MongoDB connected successfully.');
            return;
        } catch (error) {
            console.error(`MongoDB connection attempt ${i}/${retries} failed:`, error.message);
            if (i === retries) {
                console.error('All MongoDB connection attempts exhausted. Service will continue without DB (degraded mode).');
                return; // Don't exit — let the HTTP server stay alive
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected successfully.'));

const connectRedis = async () => {
    await redisClient.connect();
};

module.exports = { connectDB, connectRedis, redisClient };
