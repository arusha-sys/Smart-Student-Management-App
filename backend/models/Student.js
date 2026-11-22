const User = require('./User');

// MVC Model: Student
class Student extends User {
  constructor(data) {
    super({ ...data, role: 'student' });
    this.student_id = data.student_id || data.id;
    this.reg_no = data.reg_no || '';
    this.class_id = data.class_id || null;
    this.semester = data.semester || 1;
    this.section = data.section || 'A';
    this.roll_no = data.roll_no || '';
    this.gpa = data.gpa || 0.0;
    this.cgpa = data.cgpa || 0.0;
  }

  isAttendanceWarning(attendancePercentage) {
    return attendancePercentage < 75;
  }

  getSafeProfile() {
    return {
      ...super.getSafeProfile(),
      student_id: this.student_id,
      reg_no: this.reg_no,
      class_id: this.class_id,
      semester: this.semester,
      section: this.section,
      roll_no: this.roll_no,
      gpa: this.gpa,
      cgpa: this.cgpa
    };
  }
}

module.exports = Student;
