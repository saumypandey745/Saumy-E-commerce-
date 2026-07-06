const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_reviews';
        await mongoose.connect(mongoUrl, {
            maxPoolSize: 50,
            minPoolSize: 10,
            maxIdleTimeMS: 10000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true
        });
        console.log('[Review Service] MongoDB connected successfully.');
    } catch (error) {
        console.error('[Review Service] MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };

