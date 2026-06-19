const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startSagaConsumers } = require('./consumers/saga.consumer');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('@ecommerce/shared');

const app = express();
const PORT = process.env.PORT || 8004;

// Connect DB & MQ
connectDB();
connectRabbitMQ().then(() => {
    startSagaConsumers();
});

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'order-service', database: 'connected', messageBroker: getBrokerMode() });
});
app.use('/', orderRoutes); // Gateway maps /api/orders to /

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Order Service is running on port ${PORT}`);
});
