// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class ClassSectionRepository extends BaseRepository {
  constructor() {
    super('classes');
  }

  async create(classData) {
    const { name, semester, section, department = 'Computer Science' } = classData;
    const result = await this.db.run(
      `INSERT INTO classes (name, semester, section, department) VALUES (?, ?, ?, ?)`,
      [name, semester, section, department]
    );
    return await this.findById(result.lastID);
  }

  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    ['name', 'semester', 'section', 'department'].forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  async getStudentsByClass(classId) {
    return await this.db.all(
      `SELECT s.*, u.name, u.email, u.phone
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = ?
       ORDER BY s.roll_no ASC`,
      [classId]
    );
  }
}

module.exports = ClassSectionRepository;
