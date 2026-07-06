const fs = require('fs');
const path = require('path');

const loggerCode = `
// --- BEGIN ENTERPRISE STRUCTURED LOGGING ---
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatLog(level, args) {
    const store = asyncLocalStorage.getStore();
    const requestId = store ? store.get('x-request-id') : 'system';
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    return JSON.stringify({ timestamp: new Date().toISOString(), level, requestId, message: msg });
}

console.log = (...args) => originalLog(formatLog('info', args));
console.error = (...args) => originalError(formatLog('error', args));
console.warn = (...args) => originalWarn(formatLog('warn', args));

// Intercept requests to seed AsyncLocalStorage
app.use((req, res, next) => {
    const store = new Map();
    store.set('x-request-id', req.headers['x-request-id'] || 'unknown');
    asyncLocalStorage.run(store, () => next());
});
// --- END ENTERPRISE STRUCTURED LOGGING ---
`;

const services = ['auth-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'review-service', 'search-service', 'ai-service'];

services.forEach(svc => {
    const indexFile = path.join(__dirname, '..', 'microservices', svc, 'src', 'index.js');
    if (fs.existsSync(indexFile)) {
        let content = fs.readFileSync(indexFile, 'utf8');
        if (!content.includes('ENTERPRISE STRUCTURED LOGGING')) {
            // Find where app is defined
            const appDefIndex = content.indexOf('const app = express();');
            if (appDefIndex !== -1) {
                // Insert after app definition
                const insertIndex = content.indexOf(';', appDefIndex) + 1;
                content = content.slice(0, insertIndex) + '\\n' + loggerCode + content.slice(insertIndex);
                fs.writeFileSync(indexFile, content, 'utf8');
                console.log(`Injected structured logger into ${svc}`);
            }
        }
    }
});
