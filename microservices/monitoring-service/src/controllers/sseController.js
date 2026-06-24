const dockerService = require('../services/dockerService');
const mongoService = require('../services/mongoStatsService');
const { getRecentEvents } = require('../services/redisService');

// In-memory global stats accumulator
let globalStats = {
    api_calls: 0,
    errors: 0,
    active_users: 1240, // Simulated baseline
    revenue_today: 45000,
    pending_kyc: 142
};

exports.streamMetrics = (req, res) => {
    // Basic SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Send immediate initial payload
    res.write(`data: ${JSON.stringify({ type: 'INIT', message: 'Connected to Enterprise SSE Telemetry' })}\n\n`);

    const intervalId = setInterval(() => {
        // 1. Process Redis Events to update Global Stats
        const events = getRecentEvents();
        events.forEach(evt => {
            if (evt.type === 'GATEWAY_LOG') {
                globalStats.api_calls++;
                if (evt.data.status >= 400) {
                    globalStats.errors++;
                }
            }
        });

        // 2. Fetch Polled Metrics
        const dockerMetrics = dockerService.getMetrics();
        const mongoMetrics = mongoService.getMongoStats();

        // 3. Construct Payload
        const payload = {
            timestamp: new Date().toISOString(),
            systemHealth: {
                cpu: dockerMetrics.cpu,
                memory: dockerMetrics.memory,
                active_pods: dockerMetrics.active_pods,
                errors_1h: globalStats.errors,
                api_latency: Math.floor(Math.random() * 20 + 30) + 'ms' 
            },
            databaseHealth: mongoMetrics,
            business: globalStats,
            containers: dockerMetrics.containers,
            security_events: events.filter(e => e.type === 'SECURITY_ALERT')
        };

        // Write SSE Data
        res.write(`data: ${JSON.stringify(payload)}\n\n`);

        // Decay counters slightly to simulate sliding windows if not strictly tracking
        globalStats.errors = Math.max(0, globalStats.errors - 0.5); 
        
    }, 2000); // Flush every 2 seconds

    req.on('close', () => {
        clearInterval(intervalId);
    });
};
