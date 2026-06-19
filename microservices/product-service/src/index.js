const express = require('express');
const cors = require('cors');
const { connectDB, connectRedis } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startInventoryConsumer } = require('./consumers/inventory.consumer');
const productRoutes = require('./routes/product.routes');
const { errorHandler } = require('@ecommerce/shared');
const { startReviewConsumer } = require('./consumers/review.consumer');

const app = express();
const PORT = process.env.PORT || 8003;

// Connect DBs & MQ
connectDB();
connectRedis();
connectRabbitMQ().then(() => {
    startInventoryConsumer();
    startReviewConsumer();
});

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'product-service', database: 'connected', messageBroker: getBrokerMode() });
});
app.use('/', productRoutes); // Gateway maps /api/products to /
app.use('/categories', require('./routes/category.routes'));
app.use('/brands', require('./routes/brand.routes'));
app.use('/moderation', require('./routes/moderation.routes'));

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Product Service is running on port ${PORT}`);
});
