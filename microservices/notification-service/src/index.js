require('dotenv').config();
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startEmailConsumer } = require('./consumers/email.consumer');

// --- BEGIN ENTERPRISE STRUCTURED LOGGING ---
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatLog(level, args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    return JSON.stringify({ timestamp: new Date().toISOString(), level, service: 'notification-service', message: msg });
}

console.log = (...args) => originalLog(formatLog('info', args));
console.error = (...args) => originalError(formatLog('error', args));
console.warn = (...args) => originalWarn(formatLog('warn', args));
// --- END ENTERPRISE STRUCTURED LOGGING ---

console.log('Starting Notification Service...');

connectRabbitMQ().then(() => {
    startEmailConsumer();
}).catch(err => {
    console.error('Failed to start Notification Service:', err);
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
