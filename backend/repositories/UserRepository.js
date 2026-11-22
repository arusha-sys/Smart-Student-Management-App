// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.db.get(`SELECT * FROM users WHERE email = ?`, [email]);
  }

  async create(userData) {
    const { name, email, password, role, phone = '', address = '', is_blocked = 0 } = userData;
    const result = await this.db.run(
      `INSERT INTO users (name, email, password, role, phone, address, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, role, phone, address, is_blocked]
    );
    return await this.findById(result.lastID);
  }

  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    ['name', 'email', 'phone', 'address', 'is_blocked', 'password'].forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  async setBlockedStatus(id, isBlocked) {
    await this.db.run(`UPDATE users SET is_blocked = ? WHERE id = ?`, [isBlocked ? 1 : 0, id]);
    return await this.findById(id);
  }

  async search(query, role = null) {
    let sql = `SELECT id, name, email, role, phone, address, is_blocked, created_at FROM users WHERE (name LIKE ? OR email LIKE ?)`;
    const params = [`%${query}%`, `%${query}%`];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    sql += ' ORDER BY id DESC';

    return await this.db.all(sql, params);
  }
}

module.exports = UserRepository;
