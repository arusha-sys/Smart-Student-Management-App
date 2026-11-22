// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class SubmissionRepository extends BaseRepository {
  constructor() {
    super('submissions');
  }

  async submit({ assignment_id, student_id, submission_text = '', file_url = '' }) {
    const existing = await this.findByAssignmentAndStudent(assignment_id, student_id);
    if (existing) {
      await this.db.run(
        `UPDATE submissions 
         SET submission_text = ?, file_url = ?, submitted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [submission_text, file_url, existing.id]
      );
      return await this.findById(existing.id);
    }

    const result = await this.db.run(
      `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url)
       VALUES (?, ?, ?, ?)`,
      [assignment_id, student_id, submission_text, file_url]
    );
    return await this.findById(result.lastID);
  }

  async gradeSubmission(id, { marks_obtained, feedback }) {
    await this.db.run(
      `UPDATE submissions 
       SET marks_obtained = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [marks_obtained, feedback, id]
    );
    return await this.findById(id);
  }

  async findByAssignmentAndStudent(assignmentId, studentId) {
    return await this.db.get(
      `SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?`,
      [assignmentId, studentId]
    );
  }

  async findByAssignment(assignmentId) {
    return await this.db.all(
      `SELECT sub.*, u.name as student_name, s.reg_no, s.roll_no
       FROM submissions sub
       JOIN students s ON sub.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE sub.assignment_id = ?
       ORDER BY sub.submitted_at ASC`,
      [assignmentId]
    );
  }
}

module.exports = SubmissionRepository;
