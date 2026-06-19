const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const reviewRoutes = require('./routes/review.routes');

const app = express();
const PORT = process.env.PORT || 8009;

app.use(cors());
app.use(express.json());

// Initialize DB & Event Mesh
connectDB();
connectRabbitMQ();

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'review-service', database: 'connected', messageBroker: getBrokerMode() });
});

// Routes
app.use('/', reviewRoutes);

app.listen(PORT, () => {
    console.log(`Review Engine Service is running on port ${PORT}`);
});
