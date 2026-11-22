// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super('attendance');
  }

  async markAttendance({ course_id, student_id, date, status, lecture_topic = '', marked_by }) {
    // Check if attendance already marked for this student, course, date
    const existing = await this.db.get(
      `SELECT * FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?`,
      [course_id, student_id, date]
    );

    if (existing) {
      await this.db.run(
        `UPDATE attendance SET status = ?, lecture_topic = ?, marked_by = ? WHERE id = ?`,
        [status, lecture_topic, marked_by, existing.id]
      );
      return await this.findById(existing.id);
    }

    const result = await this.db.run(
      `INSERT INTO attendance (course_id, student_id, date, status, lecture_topic, marked_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, student_id, date, status, lecture_topic, marked_by]
    );
    return await this.findById(result.lastID);
  }

  async findByCourseAndDate(courseId, date) {
    return await this.db.all(
      `SELECT a.*, u.name as student_name, s.reg_no, s.roll_no
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE a.course_id = ? AND a.date = ?
       ORDER BY s.roll_no ASC, u.name ASC`,
      [courseId, date]
    );
  }

  async getStudentCourseAttendance(studentId, courseId) {
    const records = await this.db.all(
      `SELECT * FROM attendance WHERE student_id = ? AND course_id = ? ORDER BY date DESC`,
      [studentId, courseId]
    );

    const totalLectures = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;

    // Late can count as 0.5 present or full attendance based on university policy (we count late as present or 0.5; let's count present + late*0.5 or present count)
    const effectivePresent = presentCount + (lateCount * 0.5);
    const percentage = totalLectures > 0 ? Number(((effectivePresent / totalLectures) * 100).toFixed(1)) : 100.0;
    const isWarning = totalLectures > 0 && percentage < 75.0;

    return {
      courseId,
      totalLectures,
      presentCount,
      lateCount,
      absentCount,
      percentage,
      isWarning,
      records
    };
  }

  async getStudentAllAttendanceSummary(studentId) {
    const courses = await this.db.all(
      `SELECT c.id, c.code, c.title, u.name as teacher_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE e.student_id = ?`,
      [studentId]
    );

    const summaries = [];
    for (const c of courses) {
      const summary = await this.getStudentCourseAttendance(studentId, c.id);
      summaries.push({
        courseId: c.id,
        courseCode: c.code,
        courseTitle: c.title,
        teacherName: c.teacher_name,
        ...summary
      });
    }

    return summaries;
  }

  async getOverallAttendanceStats() {
    const totalRecords = await this.db.get(`SELECT COUNT(*) as count FROM attendance`);
    const presentRecords = await this.db.get(`SELECT COUNT(*) as count FROM attendance WHERE status = 'present'`);
    const lateRecords = await this.db.get(`SELECT COUNT(*) as count FROM attendance WHERE status = 'late'`);

    const total = totalRecords.count;
    const present = presentRecords.count;
    const late = lateRecords.count;

    const percentage = total > 0 ? Number((((present + late * 0.5) / total) * 100).toFixed(1)) : 0;

    return {
      totalLecturesMarked: total,
      overallPercentage: percentage
    };
  }
}

module.exports = AttendanceRepository;
