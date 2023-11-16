// logger.js
require('dotenv').config();
const pino = require('pino');

// Create a logging instance
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
});

module.exports.logger = logger;
