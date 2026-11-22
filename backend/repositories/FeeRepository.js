// Pattern: Repository - Mediates between the domain and data mapping layers, abstracting storage operations away from controllers and business logic
const BaseRepository = require('./BaseRepository');

class FeeRepository extends BaseRepository {
  constructor() {
    super('fees');
  }

  async findAllWithDetails() {
    return await this.db.all(
      `SELECT f.*, u.name as student_name, s.reg_no, cl.name as class_name
       FROM fees f
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       ORDER BY f.id DESC`
    );
  }

  async findByStudentId(studentId) {
    return await this.db.all(
      `SELECT f.*, u.name as student_name, s.reg_no, cl.name as class_name
       FROM fees f
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE f.student_id = ?
       ORDER BY f.due_date DESC`,
      [studentId]
    );
  }

  async findByIdWithDetails(feeId) {
    return await this.db.get(
      `SELECT f.*, u.name as student_name, u.email as student_email, s.reg_no, s.semester as current_semester,
              cl.name as class_name
       FROM fees f
       JOIN students s ON f.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE f.id = ?`,
      [feeId]
    );
  }

  async create(feeData) {
    const {
      student_id,
      title,
      semester,
      base_amount,
      discount_type = 'regular',
      discount_amount = 0.0,
      final_amount,
      status = 'pending',
      due_date,
      paid_date = null
    } = feeData;

    const result = await this.db.run(
      `INSERT INTO fees (student_id, title, semester, base_amount, discount_type, discount_amount, final_amount, status, due_date, paid_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, title, semester, base_amount, discount_type, discount_amount, final_amount, status, due_date, paid_date]
    );
    return await this.findById(result.lastID);
  }

  async updateStatus(id, status, paidDate = null) {
    const date = status === 'paid' ? (paidDate || new Date().toISOString().split('T')[0]) : null;
    await this.db.run(
      `UPDATE fees SET status = ?, paid_date = ? WHERE id = ?`,
      [status, date, id]
    );
    return await this.findById(id);
  }

  async getFeeStats() {
    const collected = await this.db.get(
      `SELECT SUM(final_amount) as total FROM fees WHERE status = 'paid'`
    );
    const pending = await this.db.get(
      `SELECT SUM(final_amount) as total FROM fees WHERE status = 'pending' OR status = 'partial'`
    );
    const countTotal = await this.db.get(`SELECT COUNT(*) as count FROM fees`);
    const countPaid = await this.db.get(`SELECT COUNT(*) as count FROM fees WHERE status = 'paid'`);

    return {
      collected: collected.total || 0,
      pending: pending.total || 0,
      totalVouchers: countTotal.count || 0,
      paidVouchers: countPaid.count || 0
    };
  }
}

module.exports = FeeRepository;
