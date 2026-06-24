const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startSyncConsumer } = require('./consumers/sync.consumer');
const searchRoutes = require('./routes/search.routes');

const app = express();
const PORT = process.env.PORT || 8008;

app.use(cors());
app.use(express.json());

// Initialize Event Mesh
connectRabbitMQ().then(() => {
    startSyncConsumer();
});

// Run Initial Search Index Synchronization
const syncProducts = require('./syncProducts');
syncProducts().then(() => {
    console.log('[Search Engine Service] Initial product synchronization complete.');
}).catch((err) => {
    console.error('[Search Engine Service] Initial product synchronization failed:', err);
});

// Routes
app.use('/', searchRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'search-service', database: 'connected', messageBroker: getBrokerMode() });
});

app.listen(PORT, () => {
    console.log(`Search Engine Service is running on port ${PORT}`);
});
