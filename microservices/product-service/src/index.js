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

const { startBulkImportConsumer } = require('./consumers/bulk_import.consumer');

// Connect DBs & MQ
connectDB();
connectRedis();
connectRabbitMQ().then(() => {
    startInventoryConsumer();
    startReviewConsumer();
    startBulkImportConsumer();
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Product Service] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'product-service', database: 'connected', messageBroker: getBrokerMode() });
});
app.use('/categories', require('./routes/category.routes'));
app.use('/brands', require('./routes/brand.routes'));
app.use('/moderation', require('./routes/moderation.routes'));
app.use('/seller', require('./routes/seller'));
app.use('/admin/sellers', require('./routes/admin.seller.routes'));
app.use('/', productRoutes); // Gateway maps /api/products to /

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Product Service is running on port ${PORT}`);
});
