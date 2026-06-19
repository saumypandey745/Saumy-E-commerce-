const mongoose = require('mongoose');
const { createClient } = require('redis');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://admin:adminpassword@localhost:27017/product_db?authSource=admin';
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
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
