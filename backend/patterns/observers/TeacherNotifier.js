// Pattern: Observer - Concrete observer dispatching notifications to Teachers
const Database = require('../singletons/Database');

class TeacherNotifier {
  constructor() {
    this.name = 'TeacherNotifier';
  }

  async update(event, payload) {
    const db = Database.getInstance();

    const relevantEvents = [
      'ANNOUNCEMENT_CREATED',
      'ASSIGNMENT_SUBMITTED',
      'TIMETABLE_UPDATED'
    ];

    if (!relevantEvents.includes(event)) {
      return null;
    }

    let userIds = [];

    if (payload.teacherUserId) {
      userIds.push(payload.teacherUserId);
    } else if (payload.targetRole === 'all' || payload.targetRole === 'teacher') {
      const rows = await db.all(`SELECT id as user_id FROM users WHERE role = 'teacher'`);
      userIds = rows.map(r => r.user_id);
    }

    const title = payload.title || `Faculty Notice: ${event}`;
    const message = payload.message || 'You have an academic update.';
    const type = payload.type || 'info';

    for (const uid of userIds) {
      await db.run(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
        [uid, title, message, type]
      );
    }

    return { observer: this.name, dispatchedCount: userIds.length, event };
  }
}

module.exports = TeacherNotifier;
