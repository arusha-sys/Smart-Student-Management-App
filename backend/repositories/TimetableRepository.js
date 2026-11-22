// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class TimetableRepository extends BaseRepository {
  constructor() {
    super('timetables');
  }

  async create(entryData) {
    const { course_id, teacher_id, class_id, day, start_time, end_time, room } = entryData;
    const result = await this.db.run(
      `INSERT INTO timetables (course_id, teacher_id, class_id, day, start_time, end_time, room)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, teacher_id, class_id, day, start_time, end_time, room]
    );
    return await this.findById(result.lastID);
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT tt.*, c.title as course_title, c.code as course_code,
              u.name as teacher_name, cl.name as class_name
       FROM timetables tt
       JOIN courses c ON tt.course_id = c.id
       LEFT JOIN teachers t ON tt.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON tt.class_id = cl.id
       ORDER BY 
         CASE tt.day 
           WHEN 'Monday' THEN 1 
           WHEN 'Tuesday' THEN 2 
           WHEN 'Wednesday' THEN 3 
           WHEN 'Thursday' THEN 4 
           WHEN 'Friday' THEN 5 
           WHEN 'Saturday' THEN 6 
           ELSE 7 
         END,
         tt.start_time ASC`
    );
  }

  async findByClass(classId) {
    return await this.db.all(
      `SELECT tt.*, c.title as course_title, c.code as course_code,
              u.name as teacher_name, cl.name as class_name
       FROM timetables tt
       JOIN courses c ON tt.course_id = c.id
       LEFT JOIN teachers t ON tt.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON tt.class_id = cl.id
       WHERE tt.class_id = ?
       ORDER BY 
         CASE tt.day 
           WHEN 'Monday' THEN 1 
           WHEN 'Tuesday' THEN 2 
           WHEN 'Wednesday' THEN 3 
           WHEN 'Thursday' THEN 4 
           WHEN 'Friday' THEN 5 
           WHEN 'Saturday' THEN 6 
           ELSE 7 
         END,
         tt.start_time ASC`,
      [classId]
    );
  }

  async findByTeacher(teacherId) {
    return await this.db.all(
      `SELECT tt.*, c.title as course_title, c.code as course_code,
              u.name as teacher_name, cl.name as class_name
       FROM timetables tt
       JOIN courses c ON tt.course_id = c.id
       LEFT JOIN teachers t ON tt.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes cl ON tt.class_id = cl.id
       WHERE tt.teacher_id = ?
       ORDER BY 
         CASE tt.day 
           WHEN 'Monday' THEN 1 
           WHEN 'Tuesday' THEN 2 
           WHEN 'Wednesday' THEN 3 
           WHEN 'Thursday' THEN 4 
           WHEN 'Friday' THEN 5 
           WHEN 'Saturday' THEN 6 
           ELSE 7 
         END,
         tt.start_time ASC`,
      [teacherId]
    );
  }
}

module.exports = TimetableRepository;
