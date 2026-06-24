const mongoose = require('mongoose');

const connectDB = async (retries = 10, delay = 3000) => {
    for (let i = 1; i <= retries; i++) {
        try {
            const conn = await mongoose.connect(
                process.env.MONGO_URI || 'mongodb://mongo:27017/cart_db',
                { serverSelectionTimeoutMS: 5000 }
            );
            console.log(`Cart MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.error(`MongoDB Error (attempt ${i}/${retries}): ${error.message}`);
            if (i === retries) {
                console.warn('Cart service continuing in degraded mode (no DB).');
                return;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

module.exports = connectDB;
