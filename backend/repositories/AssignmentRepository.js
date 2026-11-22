// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class AssignmentRepository extends BaseRepository {
  constructor() {
    super('assignments');
  }

  async create(data) {
    const { course_id, teacher_id, title, description = '', deadline, max_marks = 100 } = data;
    const result = await this.db.run(
      `INSERT INTO assignments (course_id, teacher_id, title, description, deadline, max_marks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, teacher_id, title, description, deadline, max_marks]
    );
    return await this.findById(result.lastID);
  }

  async findByCourse(courseId) {
    return await this.db.all(
      `SELECT a.*, c.title as course_title, c.code as course_code, u.name as teacher_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN teachers t ON a.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE a.course_id = ?
       ORDER BY a.deadline ASC`,
      [courseId]
    );
  }

  async findByTeacher(teacherId) {
    return await this.db.all(
      `SELECT a.*, c.title as course_title, c.code as course_code,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.teacher_id = ?
       ORDER BY a.deadline DESC`,
      [teacherId]
    );
  }

  async findStudentAssignments(studentId) {
    return await this.db.all(
      `SELECT a.*, c.title as course_title, c.code as course_code, u.name as teacher_name,
              s.id as submission_id, s.submitted_at, s.marks_obtained, s.feedback
       FROM enrollments e
       JOIN assignments a ON e.course_id = a.course_id
       JOIN courses c ON a.course_id = c.id
       JOIN teachers t ON a.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
       WHERE e.student_id = ?
       ORDER BY a.deadline ASC`,
      [studentId, studentId]
    );
  }
}

module.exports = AssignmentRepository;
