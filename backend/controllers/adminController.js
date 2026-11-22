const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const StudentRepository = require('../repositories/StudentRepository');
const TeacherRepository = require('../repositories/TeacherRepository');
const CourseRepository = require('../repositories/CourseRepository');
const ClassSectionRepository = require('../repositories/ClassSectionRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');
const FeeRepository = require('../repositories/FeeRepository');
const AnnouncementRepository = require('../repositories/AnnouncementRepository');
const TimetableRepository = require('../repositories/TimetableRepository');
const UserFactory = require('../patterns/factories/UserFactory');
const FeeService = require('../services/FeeService');
const AuthService = require('../services/AuthService');
const { notificationDispatcher } = require('../patterns/observers');

const userRepo = new UserRepository();
const studentRepo = new StudentRepository();
const teacherRepo = new TeacherRepository();
const courseRepo = new CourseRepository();
const classRepo = new ClassSectionRepository();
const attendanceRepo = new AttendanceRepository();
const feeRepo = new FeeRepository();
const announcementRepo = new AnnouncementRepository();
const timetableRepo = new TimetableRepository();
const feeService = new FeeService();
const authService = new AuthService();

// Dashboard Stats & Charts
exports.getDashboardStats = async (req, res) => {
  try {
    const allUsers = await userRepo.findAll();
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    const courses = await courseRepo.findAll();
    const classes = await classRepo.findAll();
    const attendanceStats = await attendanceRepo.getOverallAttendanceStats();
    const feeStats = await feeRepo.getFeeStats();

    // Chart distribution data
    const chartData = {
      userDistribution: [
        { name: 'Students', count: students.length },
        { name: 'Teachers', count: teachers.length }
      ],
      feeDistribution: [
        { name: 'Collected', amount: feeStats.collected },
        { name: 'Pending', amount: feeStats.pending }
      ],
      attendanceStats
    };

    res.json({
      success: true,
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        totalClasses: classes.length,
        overallAttendance: attendanceStats.overallPercentage,
        feeCollected: feeStats.collected,
        feePending: feeStats.pending
      },
      chartData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// User Management (Admin can Add / Edit / Delete / Search / Block / Unblock / Reset Password)
exports.getUsers = async (req, res) => {
  try {
    const { role, query } = req.query;
    let users;
    if (query) {
      users = await userRepo.search(query, role);
    } else if (role === 'student') {
      users = await studentRepo.findAllWithDetails();
    } else if (role === 'teacher') {
      users = await teacherRepo.findAllWithDetails();
    } else {
      users = await userRepo.findAll();
    }
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, reg_no, class_id, semester, section, roll_no, designation, department, qualification } = req.body;

    // Validate using UserFactory
    const userModel = UserFactory.create(role, { name, email, phone, address });

    const hashedPassword = await bcrypt.hash(password || 'Password@123', 10);
    const createdUser = await userRepo.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userModel.role,
      phone,
      address
    });

    if (role === 'student') {
      await studentRepo.create({
        user_id: createdUser.id,
        reg_no: reg_no || `REG-${Date.now().toString().slice(-4)}`,
        class_id: class_id || null,
        semester: semester || 1,
        section: section || 'A',
        roll_no: roll_no || ''
      });
    } else if (role === 'teacher') {
      await teacherRepo.create({
        user_id: createdUser.id,
        designation: designation || 'Lecturer',
        department: department || 'Computer Science',
        qualification: qualification || 'MS Computer Science'
      });
    }

    res.status(201).json({ success: true, message: 'User created successfully', user: createdUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, reg_no, class_id, semester, section, roll_no, designation, department, qualification } = req.body;

    const updatedUser = await userRepo.update(id, { name, email, phone, address });

    if (updatedUser.role === 'student') {
      const student = await studentRepo.findByUserId(id);
      if (student) {
        await studentRepo.update(student.id, { reg_no, class_id, semester, section, roll_no });
      }
    } else if (updatedUser.role === 'teacher') {
      const teacher = await teacherRepo.findByUserId(id);
      if (teacher) {
        await teacherRepo.update(teacher.id, { designation, department, qualification });
      }
    }

    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const user = await userRepo.setBlockedStatus(id, isBlocked);
    res.json({
      success: true,
      message: `User account has been ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await authService.resetPasswordByAdmin(id, newPassword);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userRepo.deleteById(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Course Management
exports.getCourses = async (req, res) => {
  try {
    const courses = await courseRepo.findAllWithDetails();
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const course = await courseRepo.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseRepo.update(id, req.body);
    res.json({ success: true, course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignCourseTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;
    const course = await courseRepo.assignTeacher(id, teacher_id);
    res.json({ success: true, message: 'Teacher assigned to course', course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await courseRepo.deleteById(id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Class/Section Management
exports.getClasses = async (req, res) => {
  try {
    const classes = await classRepo.findAll();
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const newClass = await classRepo.create(req.body);
    res.status(201).json({ success: true, class: newClass });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await classRepo.update(id, req.body);
    res.json({ success: true, class: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await classRepo.deleteById(id);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Timetable Management
exports.getTimetable = async (req, res) => {
  try {
    const timetable = await timetableRepo.findAllWithDetails();
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTimetable = async (req, res) => {
  try {
    const entry = await timetableRepo.create(req.body);
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await timetableRepo.deleteById(id);
    res.json({ success: true, message: 'Timetable entry deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Fee Management
exports.getFees = async (req, res) => {
  try {
    const fees = await feeRepo.findAllWithDetails();
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFeeVoucher = async (req, res) => {
  try {
    const fee = await feeService.generateFeeVoucher(req.body);
    res.status(201).json({ success: true, fee });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateFeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidDate } = req.body;
    const updated = await feeRepo.updateStatus(id, status, paidDate);
    res.json({ success: true, fee: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const notices = await announcementRepo.findAllWithDetails();
    res.json({ success: true, announcements: notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, target_role, target_class_id } = req.body;
    const notice = await announcementRepo.create({
      title,
      content,
      target_role: target_role || 'all',
      target_class_id: target_class_id || null,
      created_by: req.user.id
    });

    // Notify observers via Observer pattern
    await notificationDispatcher.notify('ANNOUNCEMENT_CREATED', {
      title,
      message: content,
      targetRole: target_role || 'all',
      classId: target_class_id
    });

    res.status(201).json({ success: true, announcement: notice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await announcementRepo.deleteById(id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
