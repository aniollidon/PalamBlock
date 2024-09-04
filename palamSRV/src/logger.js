// logger.js
require('dotenv').config();
const pino = require('pino');

/*
// Create a logging instance
const logger = pino({
    level: process.env.LOGGER_LEVEL || 'info',
});

module.exports.logger = logger;
 */


class CustomLogger {
    constructor() {
        this.level = process.env.LOGGER_LEVEL || 'info';
        console.log("Logger init! level: " + this.level);
    }

    trace(msg) {
        if(this.level === 'trace') console.log("TRACE:" + msg);
    }

    info(msg) {
        if(this.level === 'info') console.log(msg);
    }

    error(msg) {
        console.error(msg);
    }

    warn(msg) {
        console.warn(msg);
    }

    debug(msg) {
        if(this.level === 'debug' || this.level === 'trace') console.log("DEBUG:" + msg);
    }
}

const logger = new CustomLogger();
module.exports.logger = logger;
