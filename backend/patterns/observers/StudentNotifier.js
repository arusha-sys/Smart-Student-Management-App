// Pattern: Observer - Concrete observer dispatching notifications to Students
const Database = require('../singletons/Database');

class StudentNotifier {
  constructor() {
    this.name = 'StudentNotifier';
  }

  async update(event, payload) {
    const db = Database.getInstance();

    // Events applicable to students
    const relevantEvents = [
      'ANNOUNCEMENT_CREATED',
      'ATTENDANCE_WARNING',
      'ASSIGNMENT_CREATED',
      'MARKS_UPDATED',
      'FEE_GENERATED'
    ];

    if (!relevantEvents.includes(event)) {
      return null;
    }

    let userIds = [];

    if (payload.studentUserId) {
      userIds.push(payload.studentUserId);
    } else if (payload.studentUserIds && Array.isArray(payload.studentUserIds)) {
      userIds.push(...payload.studentUserIds);
    } else if (payload.courseId) {
      // Find all students enrolled in the course
      const rows = await db.all(
        `SELECT s.user_id FROM enrollments e JOIN students s ON e.student_id = s.id WHERE e.course_id = ?`,
        [payload.courseId]
      );
      userIds = rows.map(r => r.user_id);
    } else if (payload.classId) {
      // Find all students in class
      const rows = await db.all(
        `SELECT user_id FROM students WHERE class_id = ?`,
        [payload.classId]
      );
      userIds = rows.map(r => r.user_id);
    } else if (payload.targetRole === 'all' || payload.targetRole === 'student') {
      const rows = await db.all(`SELECT id as user_id FROM users WHERE role = 'student'`);
      userIds = rows.map(r => r.user_id);
    }

    const title = payload.title || `Notice: ${event}`;
    const message = payload.message || 'You have a new academic update.';
    const type = payload.type || 'info';

    // Save notification row for each target user
    for (const uid of userIds) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [uid, title, message, type]
      );
    }

    return { observer: this.name, dispatchedCount: userIds.length, event };
  }
}

module.exports = StudentNotifier;
