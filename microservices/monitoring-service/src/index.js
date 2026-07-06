const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./services/redisService');
const sseController = require('./controllers/sseController');
const dockerService = require('./services/dockerService');
const mongoService = require('./services/mongoStatsService');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8006;

app.use(cors());
app.use(express.json());

// Basic Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'monitoring-service' });
});

// Server-Sent Events Endpoint for the Super Admin Dashboard
app.get('/api/v1/monitoring/stream', sseController.streamMetrics);
app.use('/api/v1/monitoring/incidents', require('./routes/incident.routes'));
app.get('/api/v1/monitoring/reports/system', require('./controllers/reportController').exportSystemReport);

app.get('/api/v1/monitoring/containers/:name/logs', async (req, res) => {
    const logs = await dockerService.getContainerLogs(req.params.name);
    res.type('text/plain').send(logs);
});

// Start Service
const start = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected for Monitoring');

        // Connect Redis Pub/Sub for cross-service events
        await connectRedis();

        // Initialize Polling Loops
        dockerService.startPolling();
        mongoService.startMongoPolling();

        app.listen(PORT, () => {
            console.log(`Monitoring Service running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start monitoring service:', err);
    }
};

start();
