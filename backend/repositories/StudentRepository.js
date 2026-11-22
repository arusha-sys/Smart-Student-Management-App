// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  async findByUserId(userId) {
    return await this.db.get(
      `SELECT s.*, u.name, u.email, u.phone, u.address, u.is_blocked, cl.name as class_name, cl.section as class_section
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE s.user_id = ?`,
      [userId]
    );
  }

  async findByRegNo(regNo) {
    return await this.db.get(`SELECT * FROM students WHERE reg_no = ?`, [regNo]);
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT s.*, u.name, u.email, u.phone, u.address, u.is_blocked, cl.name as class_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       ORDER BY s.id DESC`
    );
  }

  async create(studentData) {
    const { user_id, reg_no, class_id = null, semester = 1, section = 'A', roll_no = '', gpa = 0.0, cgpa = 0.0 } = studentData;
    const result = await this.db.run(
      `INSERT INTO students (user_id, reg_no, class_id, semester, section, roll_no, gpa, cgpa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, reg_no, class_id, semester, section, roll_no, gpa, cgpa]
    );
    return await this.findById(result.lastID);
  }

  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    ['reg_no', 'class_id', 'semester', 'section', 'roll_no', 'gpa', 'cgpa'].forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  async getEnrolledCourses(studentId) {
    return await this.db.all(
      `SELECT c.*, u.name as teacher_name, cl.name as class_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       WHERE e.student_id = ?`,
      [studentId]
    );
  }
}

module.exports = StudentRepository;
