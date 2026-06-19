// Export shared utilities, middlewares, and constants
const authMiddleware = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.middleware');

module.exports = {
    authMiddleware,
    errorHandler
};
