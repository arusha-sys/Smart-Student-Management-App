// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class CourseRepository extends BaseRepository {
  constructor() {
    super('courses');
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT c.*, u.name as teacher_name, cl.name as class_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       ORDER BY c.id DESC`
    );
  }

  async findByIdWithDetails(courseId) {
    return await this.db.get(
      `SELECT c.*, u.name as teacher_name, cl.name as class_name
       FROM courses c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       WHERE c.id = ?`,
      [courseId]
    );
  }

  async create(courseData) {
    const { code, title, credit_hours = 3, teacher_id = null, class_id = null, semester = 1 } = courseData;
    const result = await this.db.run(
      `INSERT INTO courses (code, title, credit_hours, teacher_id, class_id, semester) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, title, credit_hours, teacher_id, class_id, semester]
    );
    return await this.findById(result.lastID);
  }

  async assignTeacher(courseId, teacherId) {
    await this.db.run(`UPDATE courses SET teacher_id = ? WHERE id = ?`, [teacherId, courseId]);
    return await this.findById(courseId);
  }

  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    ['code', 'title', 'credit_hours', 'teacher_id', 'class_id', 'semester'].forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    await this.db.run(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findById(id);
  }

  async enrollStudent(studentId, courseId, semester = 1) {
    const existing = await this.db.get(
      `SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?`,
      [studentId, courseId]
    );
    if (existing) return existing;

    const result = await this.db.run(
      `INSERT INTO enrollments (student_id, course_id, semester) VALUES (?, ?, ?)`,
      [studentId, courseId, semester]
    );
    return await this.db.get(`SELECT * FROM enrollments WHERE id = ?`, [result.lastID]);
  }

  async getEnrolledStudents(courseId) {
    return await this.db.all(
      `SELECT s.*, u.name, u.email, u.phone
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE e.course_id = ?
       ORDER BY s.roll_no ASC, u.name ASC`,
      [courseId]
    );
  }
}

module.exports = CourseRepository;
