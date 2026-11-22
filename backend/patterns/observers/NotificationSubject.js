// Pattern: Observer - Decouples event publishers from subscribers, dispatching real-time notifications to relevant user groups (Students, Teachers, Email Log)

class NotificationSubject {
  constructor() {
    this.observers = [];
  }

  attach(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  async notify(event, payload) {
    const results = [];
    for (const observer of this.observers) {
      if (typeof observer.update === 'function') {
        try {
          const res = await observer.update(event, payload);
          results.push(res);
        } catch (err) {
          console.error(`Observer error [${observer.name || 'unnamed'}]:`, err.message);
        }
      }
    }
    return results;
  }
}

module.exports = NotificationSubject;
