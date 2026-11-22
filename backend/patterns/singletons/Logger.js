// Pattern: Singleton - Provides a centralized, synchronized logging and configuration access point
class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    this.logs = [];
    Logger.instance = this;
  }

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  static resetInstance() {
    Logger.instance = null;
  }

  log(message, context = 'INFO') {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${context}] ${message}`;
    this.logs.push(entry);
    if (process.env.NODE_ENV !== 'test') {
      console.log(entry);
    }
    return entry;
  }

  warn(message) {
    return this.log(message, 'WARN');
  }

  error(message) {
    return this.log(message, 'ERROR');
  }

  getRecentLogs(limit = 20) {
    return this.logs.slice(-limit);
  }
}

module.exports = Logger;
