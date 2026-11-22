// Pattern: Singleton - Ensures a single shared database connection pool across the entire application lifecycle
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath) {
    if (Database.instance) {
      return Database.instance;
    }

    this.dbPath = dbPath || process.env.DATABASE_PATH || path.join(__dirname, '../../database/sms.sqlite');
    this.connection = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error connecting to SQLite database:', err.message);
      }
    });

    Database.instance = this;
  }

  static getInstance(dbPath) {
    if (!Database.instance) {
      Database.instance = new Database(dbPath);
    }
    return Database.instance;
  }

  // Used for testing isolation if an in-memory db is needed
  static resetInstance() {
    if (Database.instance && Database.instance.connection) {
      Database.instance.connection.close();
    }
    Database.instance = null;
  }

  getConnection() {
    return this.connection;
  }

  // Promisified query methods for repository abstraction
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.connection.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.connection.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
