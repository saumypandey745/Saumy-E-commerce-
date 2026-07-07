// Export shared utilities, middlewares, and constants
const authMiddleware = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.middleware');
const metrics = require('./middleware/metrics');

module.exports = {
    authMiddleware,
    errorHandler,
    metrics
};
