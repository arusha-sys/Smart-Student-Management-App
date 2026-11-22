// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class MarkRepository extends BaseRepository {
  constructor() {
    super('marks');
  }

  async findByCourseAndStudent(courseId, studentId) {
    return await this.db.get(
      `SELECT * FROM marks WHERE course_id = ? AND student_id = ?`,
      [courseId, studentId]
    );
  }

  async getMarksByCourse(courseId) {
    return await this.db.all(
      `SELECT m.*, u.name as student_name, s.reg_no, s.roll_no
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE m.course_id = ?
       ORDER BY s.roll_no ASC, u.name ASC`,
      [courseId]
    );
  }

  async getStudentResults(studentId) {
    return await this.db.all(
      `SELECT m.*, c.code as course_code, c.title as course_title, c.credit_hours,
              u.name as teacher_name
       FROM marks m
       JOIN courses c ON m.course_id = c.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE m.student_id = ?`,
      [studentId]
    );
  }

  async saveMark({ course_id, student_id, quiz = 0, assignment = 0, mid = 0, final = 0, total, grade, gpa, grading_type = 'absolute' }) {
    const existing = await this.findByCourseAndStudent(course_id, student_id);

    if (existing) {
      await this.db.run(
        `UPDATE marks 
         SET quiz = ?, assignment = ?, mid = ?, final = ?, total = ?, grade = ?, gpa = ?, grading_type = ?
         WHERE id = ?`,
        [quiz, assignment, mid, final, total, grade, gpa, grading_type, existing.id]
      );
      return await this.findById(existing.id);
    }

    const result = await this.db.run(
      `INSERT INTO marks (course_id, student_id, quiz, assignment, mid, final, total, grade, gpa, grading_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, student_id, quiz, assignment, mid, final, total, grade, gpa, grading_type]
    );
    return await this.findById(result.lastID);
  }

  async calculateAndSaveStudentGPA(studentId) {
    const marks = await this.getStudentResults(studentId);
    if (!marks || marks.length === 0) {
      return { gpa: 0.0, cgpa: 0.0 };
    }

    let totalPoints = 0;
    let totalCredits = 0;

    marks.forEach(m => {
      const credits = Number(m.credit_hours) || 3;
      const gpa = Number(m.gpa) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });

    const calculatedGPA = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

    await this.db.run(
      `UPDATE students SET gpa = ?, cgpa = ? WHERE id = ?`,
      [calculatedGPA, calculatedGPA, studentId]
    );

    return { gpa: calculatedGPA, cgpa: calculatedGPA };
  }
}

module.exports = MarkRepository;
