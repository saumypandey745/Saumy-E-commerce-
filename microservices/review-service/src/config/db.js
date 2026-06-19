const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_reviews';
        await mongoose.connect(mongoUrl);
        console.log('[Review Service] MongoDB connected successfully.');
    } catch (error) {
        console.error('[Review Service] MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };
