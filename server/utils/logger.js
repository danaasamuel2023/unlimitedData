const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, message + '\n');
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('INFO', message, meta);
    console.log(`[INFO] ${message}`, meta);
    this.writeToFile('app.log', formattedMessage);
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('ERROR', message, meta);
    console.error(`[ERROR] ${message}`, meta);
    this.writeToFile('error.log', formattedMessage);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('WARN', message, meta);
    console.warn(`[WARN] ${message}`, meta);
    this.writeToFile('app.log', formattedMessage);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message, meta);
      console.debug(`[DEBUG] ${message}`, meta);
      this.writeToFile('debug.log', formattedMessage);
    }
  }

  // API request logging
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.userId || 'anonymous'
    };

    if (res.statusCode >= 400) {
      this.error('API Request Failed', logData);
    } else {
      this.info('API Request', logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation, collection, data = {}) {
    this.info('Database Operation', {
      operation,
      collection,
      ...data
    });
  }

  // Payment operation logging
  logPaymentOperation(operation, data = {}) {
    this.info('Payment Operation', {
      operation,
      ...data
    });
  }

  // SMS operation logging
  logSmsOperation(operation, data = {}) {
    this.info('SMS Operation', {
      operation,
      ...data
    });
  }

  // Security event logging
  logSecurityEvent(event, data = {}) {
    this.warn('Security Event', {
      event,
      ...data
    });
  }

  // Performance logging
  logPerformance(operation, duration, data = {}) {
    this.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...data
    });
  }
}

module.exports = new Logger();
