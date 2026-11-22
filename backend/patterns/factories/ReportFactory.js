// Pattern: Factory - Creates appropriate report generators (AttendanceReport, ResultReport, FeeReport) based on requested type
const Database = require('../singletons/Database');

class BaseReport {
  constructor() {
    this.db = Database.getInstance();
  }

  async generate(filter = {}) {
    throw new Error('Method generate() must be implemented');
  }
}

class AttendanceReport extends BaseReport {
  async generate(filter = {}) {
    let sql = `
      SELECT 
        a.id, a.date, a.status, a.lecture_topic,
        c.code as course_code, c.title as course_title,
        u.name as student_name, s.reg_no,
        cl.name as class_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (filter.course_id) {
      sql += ' AND a.course_id = ?';
      params.push(filter.course_id);
    }
    if (filter.student_id) {
      sql += ' AND a.student_id = ?';
      params.push(filter.student_id);
    }
    if (filter.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filter.class_id);
    }

    sql += ' ORDER BY a.date DESC';
    const rows = await this.db.all(sql, params);

    return {
      title: 'Student Attendance Report',
      headers: ['student_name', 'reg_no', 'course_code', 'date', 'status', 'lecture_topic'],
      rows
    };
  }
}

class ResultReport extends BaseReport {
  async generate(filter = {}) {
    let sql = `
      SELECT 
        m.id, m.quiz, m.assignment, m.mid, m.final, m.total, m.grade, m.gpa, m.grading_type,
        c.code as course_code, c.title as course_title,
        u.name as student_name, s.reg_no,
        cl.name as class_name
      FROM marks m
      JOIN courses c ON m.course_id = c.id
      JOIN students s ON m.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (filter.course_id) {
      sql += ' AND m.course_id = ?';
      params.push(filter.course_id);
    }
    if (filter.student_id) {
      sql += ' AND m.student_id = ?';
      params.push(filter.student_id);
    }
    if (filter.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filter.class_id);
    }

    sql += ' ORDER BY u.name ASC';
    const rows = await this.db.all(sql, params);

    return {
      title: 'Student Academic Results Report',
      headers: ['student_name', 'reg_no', 'course_code', 'quiz', 'assignment', 'mid', 'final', 'total', 'grade', 'gpa'],
      rows
    };
  }
}

class FeeReport extends BaseReport {
  async generate(filter = {}) {
    let sql = `
      SELECT 
        f.id, f.title, f.semester, f.base_amount, f.discount_type, f.discount_amount, 
        f.final_amount, f.status, f.due_date, f.paid_date,
        u.name as student_name, s.reg_no,
        cl.name as class_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes cl ON s.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (filter.status) {
      sql += ' AND f.status = ?';
      params.push(filter.status);
    }
    if (filter.student_id) {
      sql += ' AND f.student_id = ?';
      params.push(filter.student_id);
    }
    if (filter.semester) {
      sql += ' AND f.semester = ?';
      params.push(filter.semester);
    }

    sql += ' ORDER BY f.due_date ASC';
    const rows = await this.db.all(sql, params);

    return {
      title: 'Student Fee Collection Report',
      headers: ['student_name', 'reg_no', 'title', 'semester', 'base_amount', 'discount_amount', 'final_amount', 'status', 'due_date'],
      rows
    };
  }
}

class ReportFactory {
  /**
   * Factory method to return appropriate report generator
   * @param {string} type - 'attendance' | 'result' | 'fee'
   * @returns {AttendanceReport|ResultReport|FeeReport}
   */
  static create(type) {
    if (!type) {
      throw new Error('Report type is required');
    }

    const normalizedType = type.toLowerCase().trim();

    switch (normalizedType) {
      case 'attendance':
        return new AttendanceReport();
      case 'result':
      case 'marks':
        return new ResultReport();
      case 'fee':
        return new FeeReport();
      default:
        throw new Error(`Invalid report type: ${type}. Supported types: attendance, result, fee`);
    }
  }
}

module.exports = {
  ReportFactory,
  AttendanceReport,
  ResultReport,
  FeeReport
};
