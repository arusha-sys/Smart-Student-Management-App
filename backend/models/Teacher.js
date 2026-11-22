const User = require('./User');

// MVC Model: Teacher
class Teacher extends User {
  constructor(data) {
    super({ ...data, role: 'teacher' });
    this.teacher_id = data.teacher_id || data.id;
    this.designation = data.designation || 'Lecturer';
    this.department = data.department || 'Computer Science';
    this.qualification = data.qualification || 'MS Computer Science';
  }

  getSafeProfile() {
    return {
      ...super.getSafeProfile(),
      teacher_id: this.teacher_id,
      designation: this.designation,
      department: this.department,
      qualification: this.qualification
    };
  }
}

module.exports = Teacher;
