// Pattern: Observer - Concrete observer logging email notifications for audit and simulated delivery
const Logger = require('../singletons/Logger');

class EmailLogObserver {
  constructor() {
    this.name = 'EmailLogObserver';
    this.deliveryLogs = [];
  }

  async update(event, payload) {
    const logger = Logger.getInstance();
    const timestamp = new Date().toISOString();
    const logEntry = {
      event,
      title: payload.title,
      summary: payload.message ? payload.message.substring(0, 80) : '',
      timestamp
    };

    this.deliveryLogs.push(logEntry);
    logger.log(`[Email Simulation] Sent notification: "${payload.title}" for event: ${event}`, 'EMAIL');

    return { observer: this.name, logged: true, event };
  }
}

module.exports = EmailLogObserver;
