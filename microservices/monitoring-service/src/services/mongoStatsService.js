const mongoose = require('mongoose');

let cachedDbStats = {
    connections: 0,
    queries_per_sec: 0,
    slow_queries: 0,
    uptime: 0
};

let previousOpCounters = null;
let lastPollTime = Date.now();

const startMongoPolling = () => {
    setInterval(async () => {
        try {
            if (mongoose.connection.readyState !== 1) return;
            
            const adminDb = mongoose.connection.db.admin();
            const status = await adminDb.serverStatus();
            
            const now = Date.now();
            const timeDiff = (now - lastPollTime) / 1000;
            
            let queriesPerSec = 0;
            if (previousOpCounters && timeDiff > 0) {
                const queryDiff = status.opcounters.query - previousOpCounters.query;
                queriesPerSec = Math.max(0, queryDiff / timeDiff);
            }
            
            previousOpCounters = status.opcounters;
            lastPollTime = now;

            cachedDbStats = {
                connections: status.connections.current,
                queries_per_sec: queriesPerSec.toFixed(1),
                uptime: status.uptime,
                // MongoDB doesn't expose slow queries trivially without profiling enabled, fallback to mock if 0
                slow_queries: 0
            };
        } catch (err) {
            console.error('MongoDB polling error:', err.message);
        }
    }, 5000);
};

const getMongoStats = () => cachedDbStats;

module.exports = { startMongoPolling, getMongoStats };
