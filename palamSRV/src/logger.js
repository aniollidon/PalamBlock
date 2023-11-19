// logger.js
require('dotenv').config();
const pino = require('pino');

// Create a logging instance
const logger = pino({
    level: process.env.LOGGER_LEVEL || 'info',
});

module.exports.logger = logger;
