const User = require('./User');

// MVC Model: Admin
class Admin extends User {
  constructor(data) {
    super({ ...data, role: 'admin' });
    this.permissions = ['ALL'];
  }

  canManageUsers() {
    return true;
  }
}

module.exports = Admin;
