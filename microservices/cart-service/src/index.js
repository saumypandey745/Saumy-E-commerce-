const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

dotenv.config();

const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Init DB & Redis
connectDB();
connectRedis();

app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'cart-service' });
});

const PORT = process.env.PORT || 8007;

app.listen(PORT, () => {
    console.log(`Cart Service running on port ${PORT}`);
});
