// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const Database = require('../patterns/singletons/Database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = Database.getInstance();
  }

  async findById(id) {
    return await this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async findAll() {
    return await this.db.all(`SELECT * FROM ${this.tableName} ORDER BY id DESC`);
  }

  async deleteById(id) {
    const result = await this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }
}

module.exports = BaseRepository;
