const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ServerMonitor {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:5000',
      checkInterval: config.checkInterval || 30000, // 30 seconds
      alertThreshold: config.alertThreshold || 3, // 3 consecutive failures
      logFile: config.logFile || path.join(__dirname, 'logs', 'monitor.log'),
      webhookUrl: config.webhookUrl || null,
      emailConfig: config.emailConfig || null,
      ...config
    };
    
    this.failureCount = 0;
    this.lastCheck = null;
    this.isRunning = false;
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    const logLine = JSON.stringify(logEntry);
    console.log(`[${timestamp}] [${level}] ${message}`, data);
    
    // Write to log file
    fs.appendFileSync(this.config.logFile, logLine + '\n');
  }

  async checkHealth() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.baseUrl}/health`, {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.status === 'OK') {
        this.failureCount = 0;
        this.lastCheck = {
          status: 'healthy',
          responseTime,
          timestamp: new Date().toISOString(),
          data: response.data
        };
        
        this.log('INFO', 'Health check passed', {
          responseTime,
          uptime: response.data.uptime,
          environment: response.data.environment
        });
        
        return true;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.failureCount++;
      this.lastCheck = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.log('ERROR', 'Health check failed', {
        error: error.message,
        failureCount: this.failureCount
      });
      
      if (this.failureCount >= this.config.alertThreshold) {
        await this.sendAlert();
      }
      
      return false;
    }
  }

  async checkApiEndpoints() {
    const endpoints = [
      { path: '/', method: 'GET', name: 'Root endpoint' },
      { path: '/api/v1/register', method: 'POST', name: 'Registration endpoint', expectError: true },
      { path: '/api/v1/data/purchase-data', method: 'POST', name: 'Purchase endpoint', expectError: true }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await axios({
          method: endpoint.method,
          url: `${this.config.baseUrl}${endpoint.path}`,
          timeout: 5000,
          data: endpoint.method === 'POST' ? {} : undefined
        });
        const responseTime = Date.now() - startTime;

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: 'success',
          responseTime,
          statusCode: response.status
        });

        this.log('INFO', `Endpoint check passed: ${endpoint.name}`, {
          path: endpoint.path,
          responseTime,
          statusCode: response.status
        });
      } catch (error) {
        const isExpectedError = endpoint.expectError && (
          error.response?.status === 400 || 
          error.response?.status === 401 || 
          error.response?.status === 422
        );

        if (!isExpectedError) {
          results.push({
            name: endpoint.name,
            path: endpoint.path,
            status: 'error',
            error: error.message,
            statusCode: error.response?.status
          });

          this.log('ERROR', `Endpoint check failed: ${endpoint.name}`, {
            path: endpoint.path,
            error: error.message,
            statusCode: error.response?.status
          });
        } else {
          results.push({
            name: endpoint.name,
            path: endpoint.path,
            status: 'success',
            responseTime: 0,
            statusCode: error.response?.status,
            note: 'Expected error for validation'
          });
        }
      }
    }

    return results;
  }

  async checkDatabase() {
    try {
      // This would require a database health check endpoint
      const response = await axios.get(`${this.config.baseUrl}/health/database`, {
        timeout: 5000
      });

      if (response.status === 200) {
        this.log('INFO', 'Database check passed', response.data);
        return { status: 'healthy', data: response.data };
      } else {
        throw new Error(`Database check failed: ${response.status}`);
      }
    } catch (error) {
      this.log('ERROR', 'Database check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkExternalServices() {
    const services = [
      { name: 'Paystack', url: 'https://api.paystack.co' },
      { name: 'mNotify', url: 'https://apps.mnotify.net' },
      { name: 'DataMart', url: 'https://api.datamartgh.shop' }
    ];

    const results = [];

    for (const service of services) {
      try {
        const startTime = Date.now();
        const response = await axios.get(service.url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;

        results.push({
          name: service.name,
          status: 'available',
          responseTime,
          statusCode: response.status
        });

        this.log('INFO', `External service available: ${service.name}`, {
          responseTime,
          statusCode: response.status
        });
      } catch (error) {
        results.push({
          name: service.name,
          status: 'unavailable',
          error: error.message,
          statusCode: error.response?.status
        });

        this.log('WARN', `External service unavailable: ${service.name}`, {
          error: error.message,
          statusCode: error.response?.status
        });
      }
    }

    return results;
  }

  async sendAlert() {
    const alertData = {
      type: 'server_down',
      message: `Server health check failed ${this.failureCount} times`,
      timestamp: new Date().toISOString(),
      lastCheck: this.lastCheck,
      config: {
        baseUrl: this.config.baseUrl,
        checkInterval: this.config.checkInterval
      }
    };

    // Send webhook alert
    if (this.config.webhookUrl) {
      try {
        await axios.post(this.config.webhookUrl, alertData, {
          timeout: 5000
        });
        this.log('INFO', 'Webhook alert sent successfully');
      } catch (error) {
        this.log('ERROR', 'Failed to send webhook alert', { error: error.message });
      }
    }

    // Send email alert (if configured)
    if (this.config.emailConfig) {
      // Implement email sending logic here
      this.log('INFO', 'Email alert would be sent here');
    }

    this.log('ALERT', 'Server alert triggered', alertData);
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      server: {
        baseUrl: this.config.baseUrl,
        lastCheck: this.lastCheck,
        failureCount: this.failureCount,
        isHealthy: this.failureCount === 0
      },
      checks: {
        health: await this.checkHealth(),
        endpoints: await this.checkApiEndpoints(),
        database: await this.checkDatabase(),
        externalServices: await this.checkExternalServices()
      }
    };

    return report;
  }

  start() {
    if (this.isRunning) {
      this.log('WARN', 'Monitor is already running');
      return;
    }

    this.isRunning = true;
    this.log('INFO', 'Starting server monitor', {
      baseUrl: this.config.baseUrl,
      checkInterval: this.config.checkInterval
    });

    // Initial check
    this.checkHealth();

    // Set up interval
    this.interval = setInterval(async () => {
      await this.checkHealth();
    }, this.config.checkInterval);

    // Generate periodic reports
    this.reportInterval = setInterval(async () => {
      const report = await this.generateReport();
      this.log('INFO', 'Periodic health report', report);
    }, 300000); // Every 5 minutes
  }

  stop() {
    if (!this.isRunning) {
      this.log('WARN', 'Monitor is not running');
      return;
    }

    this.isRunning = false;
    this.log('INFO', 'Stopping server monitor');

    if (this.interval) {
      clearInterval(this.interval);
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }

  // Graceful shutdown
  setupGracefulShutdown() {
    process.on('SIGINT', () => {
      this.log('INFO', 'Received SIGINT, shutting down gracefully');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('INFO', 'Received SIGTERM, shutting down gracefully');
      this.stop();
      process.exit(0);
    });
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new ServerMonitor({
    baseUrl: process.env.MONITOR_BASE_URL || 'http://localhost:5000',
    checkInterval: parseInt(process.env.MONITOR_INTERVAL) || 30000,
    alertThreshold: parseInt(process.env.MONITOR_ALERT_THRESHOLD) || 3,
    webhookUrl: process.env.MONITOR_WEBHOOK_URL || null
  });

  monitor.setupGracefulShutdown();
  monitor.start();

  // Generate initial report
  setTimeout(async () => {
    const report = await monitor.generateReport();
    console.log('\n📊 Initial Health Report:');
    console.log(JSON.stringify(report, null, 2));
  }, 5000);
}

module.exports = ServerMonitor;
