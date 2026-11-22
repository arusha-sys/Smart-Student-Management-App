const AuthService = require('../services/AuthService');
const UserRepository = require('../repositories/UserRepository');
const StudentRepository = require('../repositories/StudentRepository');
const TeacherRepository = require('../repositories/TeacherRepository');
const UserFactory = require('../patterns/factories/UserFactory');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authService = new AuthService();
const userRepo = new UserRepository();
const studentRepo = new StudentRepository();
const teacherRepo = new TeacherRepository();

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let roleDetails = null;
    if (user.role === 'student') {
      roleDetails = await studentRepo.findByUserId(user.id);
    } else if (user.role === 'teacher') {
      roleDetails = await teacherRepo.findByUserId(user.id);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        details: roleDetails
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { phone, address } = req.body;
    const updated = await userRepo.update(req.user.id, { phone, address });
    res.json({ success: true, message: 'Profile updated successfully', user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Pattern: Factory - UserFactory.create() builds correct role-based model before persisting
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, reg_no, designation } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Self-signup is only available for student or teacher roles.' });
    }

    // Strong password validation (matches frontend rules)
    const pwErrors = [];
    if (password.length < 8)             pwErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(password))         pwErrors.push('one uppercase letter');
    if (!/[a-z]/.test(password))         pwErrors.push('one lowercase letter');
    if (!/\d/.test(password))            pwErrors.push('one number');
    if (!/[!@#$%^&*()_+\-=[\]{};':",.<>?/\\|`~]/.test(password)) pwErrors.push('one special character');
    if (pwErrors.length > 0) {
      return res.status(400).json({ error: `Password must contain: ${pwErrors.join(', ')}.` });
    }

    // Check email uniqueness
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Build role-based model via Factory Pattern
    const userModel = UserFactory.create(role, { name, email, phone, address });

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Persist user record
    const newUser = await userRepo.create({
      name: userModel.name,
      email: userModel.email,
      password: password_hash,
      role: userModel.role,
      phone: userModel.phone || null,
      address: address || null,
      is_active: 1,
    });

    // Create role-specific profile
    if (role === 'student') {
      await studentRepo.create({
        user_id: newUser.id,
        reg_no: reg_no || `REG-${newUser.id}`,
        semester: 1,
        section: 'A',
        program: 'BS Computer Science',
      });
    } else if (role === 'teacher') {
      await teacherRepo.create({
        user_id: newUser.id,
        designation: designation || 'Lecturer',
        qualification: 'MS',
      });
    }

    // Issue JWT (auto-login)
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'sms_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
    } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This email or registration number is already registered.' });
    }
    res.status(500).json({ error: err.message });
  }
};
