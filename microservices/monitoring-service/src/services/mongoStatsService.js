const mongoose = require('mongoose');
const axios = require('axios');

let cachedDbStats = {
    connections: 0,
    queries_per_sec: 0,
    slow_queries: 0,
    uptime: 0
};

let cachedBusinessStats = {
    active_users: 0,
    revenue_today: 0,
    pending_kyc: 0
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
                slow_queries: 0
            };
        } catch (err) {
            console.error('MongoDB polling error:', err.message);
        }
    }, 5000);

    // Business Analytics Polling (every 10s)
    setInterval(async () => {
        try {
            // 1. Fetch user stats from auth-service (PostgreSQL) via internal network call
            let active_users = 0;
            try {
                const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
                const response = await axios.get(`${authUrl}/admin/users/stats`, {
                    headers: { 'x-user-role': 'SUPER_ADMIN', 'x-internal-service': 'monitoring-service' }
                });
                if (response.data && response.data.success) {
                    active_users = response.data.count;
                }
            } catch (authErr) {
                console.error('Failed to fetch user stats from Auth Service:', authErr.message);
            }

            // 2. Fetch order and seller stats from shared MongoDB
            let revenue_today = 0;
            let pending_kyc = 0;
            if (mongoose.connection.readyState === 1) {
                const db = mongoose.connection.db;
                
                const startOfDay = new Date();
                startOfDay.setHours(0,0,0,0);
                const revenueResult = await db.collection('orders').aggregate([
                    { $match: { createdAt: { $gte: startOfDay }, status: { $in: ['PAID', 'DELIVERED', 'SHIPPED', 'COMPLETED'] } } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]).toArray();
                revenue_today = revenueResult.length > 0 ? revenueResult[0].total : 0;

                // Pending KYC are sellers waiting for approval in store_profiles
                pending_kyc = await db.collection('storeprofiles').countDocuments({ kyc_status: 'PENDING' });
            }

            cachedBusinessStats = {
                active_users,
                revenue_today,
                pending_kyc
            };
        } catch (err) {
            console.error('Business Analytics polling error:', err.message);
        }
    }, 10000);
};

const getMongoStats = () => cachedDbStats;
const getBusinessStats = () => cachedBusinessStats;

module.exports = { startMongoPolling, getMongoStats, getBusinessStats };
