// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super('announcements');
  }

  async create(announcementData) {
    const { title, content, target_role = 'all', target_class_id = null, created_by } = announcementData;
    const result = await this.db.run(
      `INSERT INTO announcements (title, content, target_role, target_class_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, content, target_role, target_class_id, created_by]
    );
    return await this.findById(result.lastID);
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT a.*, u.name as author_name, u.role as author_role, cl.name as class_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       LEFT JOIN classes cl ON a.target_class_id = cl.id
       ORDER BY a.created_at DESC`
    );
  }

  async findForUser(role, classId = null) {
    let sql = `
      SELECT a.*, u.name as author_name, u.role as author_role
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.target_role = 'all' OR a.target_role = ?
    `;
    const params = [role];

    if (classId) {
      sql += ` OR (a.target_role = 'class' AND a.target_class_id = ?)`;
      params.push(classId);
    }

    sql += ' ORDER BY a.created_at DESC';
    return await this.db.all(sql, params);
  }
}

module.exports = AnnouncementRepository;
