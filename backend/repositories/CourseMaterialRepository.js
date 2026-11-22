// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class CourseMaterialRepository extends BaseRepository {
  constructor() {
    super('course_materials');
  }

  async create(data) {
    const { course_id, teacher_id, title, description = '', file_url } = data;
    const result = await this.db.run(
      `INSERT INTO course_materials (course_id, teacher_id, title, description, file_url)
       VALUES (?, ?, ?, ?, ?)`,
      [course_id, teacher_id, title, description, file_url]
    );
    return await this.findById(result.lastID);
  }

  async findByCourse(courseId) {
    return await this.db.all(
      `SELECT m.*, u.name as teacher_name
       FROM course_materials m
       JOIN teachers t ON m.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE m.course_id = ?
       ORDER BY m.created_at DESC`,
      [courseId]
    );
  }

  async findForStudent(studentId) {
    return await this.db.all(
      `SELECT m.*, c.title as course_title, c.code as course_code, u.name as teacher_name
       FROM enrollments e
       JOIN course_materials m ON e.course_id = m.course_id
       JOIN courses c ON m.course_id = c.id
       JOIN teachers t ON m.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE e.student_id = ?
       ORDER BY m.created_at DESC`,
      [studentId]
    );
  }
}

module.exports = CourseMaterialRepository;
