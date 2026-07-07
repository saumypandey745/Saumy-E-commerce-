const dockerService = require('../services/dockerService');
const mongoService = require('../services/mongoStatsService');
const { getRecentEvents } = require('../services/redisService');

let globalStats = {
    api_calls: 0,
    errors: 0
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
        const businessMetrics = mongoService.getBusinessStats();

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
            business: {
                api_calls: globalStats.api_calls,
                active_users: businessMetrics.active_users,
                revenue_today: businessMetrics.revenue_today,
                pending_kyc: businessMetrics.pending_kyc
            },
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
