// src/services/loggerService.js
const LOG_LEVELS = {
DEBUG: 0,
INFO: 1,
WARN: 2,
ERROR: 3,
};

// Set the current log level (can be adjusted based on environment)
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
? LOG_LEVELS.WARN 
: LOG_LEVELS.DEBUG;

class Logger {
constructor(module) {
    this.module = module;
    this.logHistory = [];
    this.maxHistoryLength = 100; // Limit history to prevent memory issues
}

_shouldLog(level) {
    return level >= CURRENT_LOG_LEVEL;
}

_formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${this.module}] [${Object.keys(LOG_LEVELS)[level]}]: ${message}`;
    
    // Add to history
    this.logHistory.unshift({
    timestamp,
    module: this.module,
    level: Object.keys(LOG_LEVELS)[level],
    message
    });
    
    // Trim history if needed
    if (this.logHistory.length > this.maxHistoryLength) {
    this.logHistory.pop();
    }
    
    return formattedMessage;
}

debug(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(this._formatMessage(LOG_LEVELS.DEBUG, message), ...args);
    }
}

info(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
    console.info(this._formatMessage(LOG_LEVELS.INFO, message), ...args);
    }
}

warn(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
    console.warn(this._formatMessage(LOG_LEVELS.WARN, message), ...args);
    }
}

error(message, ...args) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
    console.error(this._formatMessage(LOG_LEVELS.ERROR, message), ...args);
    }
}

getHistory() {
    return [...this.logHistory];
}

clearHistory() {
    this.logHistory = [];
}
}

// Factory function to create loggers for different modules
export const createLogger = (module) => new Logger(module);

// Create a global application logger
export const appLogger = createLogger('App');

export default {
createLogger,
appLogger
};
