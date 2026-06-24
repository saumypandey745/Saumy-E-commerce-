const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startPaymentConsumer } = require('./consumers/payment.consumer');
const { startSellerConsumer } = require('./consumers/seller.consumer');
const paymentRoutes = require('./routes/payment.routes');
const { errorHandler } = require('@ecommerce/shared');

const app = express();
const PORT = process.env.PORT || 8006;

app.use(cors());

const webhookRoutes = require('./routes/webhook.routes');
app.use('/webhook', express.raw({type: 'application/json'}), webhookRoutes);
app.use(express.json());

connectDB();
connectRabbitMQ().then(() => {
    startPaymentConsumer();
    startSellerConsumer();
});

app.use('/', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'payment-service', database: 'connected', messageBroker: getBrokerMode() });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Payment Service is running on port ${PORT}`);
});
