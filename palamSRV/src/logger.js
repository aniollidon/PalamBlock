// logger.js
require('dotenv').config();

const DEVELOPMENT = process.env.NODE_ENV === 'development';

class CustomLogger {
    constructor() {
        this.level = process.env.LOGGER_LEVEL || 'info';
        console.log("Logger init! level: " + this.level);
    }

    trace(msg) {
        if(this.level === 'trace') console.log("TRACE:" + msg);
    }

    info(msg) {
        if(this.level === 'info' || this.level === 'debug' || this.level === 'trace') console.log(msg);
    }

    error(msg) {
        console.error(msg);
        if(DEVELOPMENT)
        throw new Error(msg); //TODO HIDE THIS IN PRODUCTION
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
