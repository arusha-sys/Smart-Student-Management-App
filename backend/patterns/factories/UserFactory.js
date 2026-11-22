// Pattern: Factory - Encapsulates creation of role-specific user instances (Admin, Teacher, Student) with proper defaults and behavior
const Admin = require('../../models/Admin');
const Teacher = require('../../models/Teacher');
const Student = require('../../models/Student');

class UserFactory {
  /**
   * Factory method to create appropriate User subclass
   * @param {string} role - 'admin' | 'teacher' | 'student'
   * @param {object} data - user data attributes
   * @returns {Admin|Teacher|Student}
   */
  static create(role, data = {}) {
    if (!role) {
      throw new Error('User role is required');
    }

    const normalizedRole = role.toLowerCase().trim();

    switch (normalizedRole) {
      case 'admin':
        return new Admin(data);
      case 'teacher':
        return new Teacher(data);
      case 'student':
        return new Student(data);
      default:
        throw new Error(`Invalid user role: ${role}. Supported roles: admin, teacher, student`);
    }
  }
}

module.exports = UserFactory;
