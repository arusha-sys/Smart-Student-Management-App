const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const StudentRepository = require('../repositories/StudentRepository');
const TeacherRepository = require('../repositories/TeacherRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'sms_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
    this.studentRepo = new StudentRepository();
    this.teacherRepo = new TeacherRepository();
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.is_blocked) {
      throw new Error('Account has been blocked by administrator. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Role specific details
    let roleDetails = null;
    if (user.role === 'student') {
      roleDetails = await this.studentRepo.findByUserId(user.id);
    } else if (user.role === 'teacher') {
      roleDetails = await this.teacherRepo.findByUserId(user.id);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: roleDetails && user.role === 'student' ? roleDetails.id : null,
      teacherId: roleDetails && user.role === 'teacher' ? roleDetails.id : null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        details: roleDetails
      }
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { password: hashedPassword });

    return { message: 'Password updated successfully' };
  }

  async resetPasswordByAdmin(userId, newPassword = 'Password@123') {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { password: hashedPassword });

    return { message: `Password reset successfully to: ${newPassword}` };
  }
}

module.exports = AuthService;
