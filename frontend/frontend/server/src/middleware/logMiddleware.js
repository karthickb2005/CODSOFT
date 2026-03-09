const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add a unique request ID to each request
 */
const requestCorrelation = (req, res, next) => {
    const correlationId = req.header('X-Correlation-ID') || uuidv4();
    req.id = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
};

module.exports = {
    requestCorrelation
};
