// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class TeacherRepository extends BaseRepository {
  constructor() {
    super('teachers');
  }

  async findByUserId(userId) {
    return await this.db.get(
      `SELECT t.*, u.name, u.email, u.phone, u.address, u.is_blocked
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = ?`,
      [userId]
    );
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT t.*, u.name, u.email, u.phone, u.address, u.is_blocked
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.id DESC`
    );
  }

  async create(teacherData) {
    const { user_id, designation = 'Lecturer', department = 'Computer Science', qualification = 'MS CS' } = teacherData;
    const result = await this.db.run(
      `INSERT INTO teachers (user_id, designation, department, qualification) VALUES (?, ?, ?, ?)`,
      [user_id, designation, department, qualification]
    );
    return await this.findById(result.lastID);
  }

  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    ['designation', 'department', 'qualification'].forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  async getAssignedCourses(teacherId) {
    return await this.db.all(
      `SELECT c.*, cl.name as class_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled
       FROM courses c
       LEFT JOIN classes cl ON c.class_id = cl.id
       WHERE c.teacher_id = ?`,
      [teacherId]
    );
  }
}

module.exports = TeacherRepository;
