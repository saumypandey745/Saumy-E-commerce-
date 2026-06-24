const axios = require('axios');

const GATEWAY_URL = 'http://localhost:8000';

const trafficSim = async () => {
    console.log('Starting Live Traffic Simulation to populate metrics...');
    setInterval(async () => {
        try {
            // Hit public endpoint
            await axios.get(`${GATEWAY_URL}/api/products`);
        } catch(e) {}
    }, 1000); // 1 success request per second

    setInterval(async () => {
        try {
            // Hit unauthorized endpoint to trigger Security Alerts
            await axios.get(`${GATEWAY_URL}/api/products/secure-endpoint`);
        } catch(e) {}
    }, 3500); // 1 security alert every 3.5 seconds
};

trafficSim();
