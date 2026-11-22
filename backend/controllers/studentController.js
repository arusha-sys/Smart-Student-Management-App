const StudentRepository = require('../repositories/StudentRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');
const MarkRepository = require('../repositories/MarkRepository');
const AssignmentRepository = require('../repositories/AssignmentRepository');
const SubmissionRepository = require('../repositories/SubmissionRepository');
const CourseMaterialRepository = require('../repositories/CourseMaterialRepository');
const TimetableRepository = require('../repositories/TimetableRepository');
const AnnouncementRepository = require('../repositories/AnnouncementRepository');
const FeeRepository = require('../repositories/FeeRepository');
const FeeService = require('../services/FeeService');
const Database = require('../patterns/singletons/Database');
const { notificationDispatcher } = require('../patterns/observers');

const studentRepo = new StudentRepository();
const attendanceRepo = new AttendanceRepository();
const markRepo = new MarkRepository();
const assignmentRepo = new AssignmentRepository();
const submissionRepo = new SubmissionRepository();
const materialRepo = new CourseMaterialRepository();
const timetableRepo = new TimetableRepository();
const announcementRepo = new AnnouncementRepository();
const feeRepo = new FeeRepository();
const feeService = new FeeService();

async function getStudentId(userId) {
  const student = await studentRepo.findByUserId(userId);
  if (!student) throw new Error('Student profile record not found');
  return student;
}

exports.getDashboard = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const enrolledCourses = await studentRepo.getEnrolledCourses(student.id);
    const attendanceSummary = await attendanceRepo.getStudentAllAttendanceSummary(student.id);
    const results = await markRepo.getStudentResults(student.id);
    const fees = await feeRepo.findByStudentId(student.id);
    const notices = await announcementRepo.findForUser('student', student.class_id);

    // Calculate warnings
    const lowAttendanceCourses = attendanceSummary.filter(c => c.isWarning);

    res.json({
      success: true,
      student,
      stats: {
        enrolledCoursesCount: enrolledCourses.length,
        gpa: student.gpa,
        cgpa: student.cgpa,
        lowAttendanceCount: lowAttendanceCourses.length
      },
      lowAttendanceWarnings: lowAttendanceCourses,
      recentNotices: notices.slice(0, 5),
      feeOverview: fees[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const courses = await studentRepo.getEnrolledCourses(student.id);
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const summary = await attendanceRepo.getStudentAllAttendanceSummary(student.id);
    res.json({ success: true, attendance: summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const results = await markRepo.getStudentResults(student.id);
    res.json({
      success: true,
      results,
      gpa: student.gpa,
      cgpa: student.cgpa
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const assignments = await assignmentRepo.findStudentAssignments(student.id);
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const { assignment_id, submission_text, file_url } = req.body;

    // Check deadline
    const assignment = await assignmentRepo.findById(assignment_id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const deadlineTime = new Date(assignment.deadline).getTime();
    if (deadlineTime < Date.now()) {
      return res.status(400).json({ error: 'Assignment submission deadline has passed' });
    }

    const submission = await submissionRepo.submit({
      assignment_id,
      student_id: student.id,
      submission_text,
      file_url
    });

    // Notify teacher via Observer pattern
    await notificationDispatcher.notify('ASSIGNMENT_SUBMITTED', {
      teacherUserId: assignment.teacher_id,
      title: `Assignment Submitted: ${assignment.title}`,
      message: `${req.user.name} submitted their work for ${assignment.title}.`
    });

    res.json({ success: true, message: 'Assignment submitted successfully', submission });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    let timetable = [];
    if (student.class_id) {
      timetable = await timetableRepo.findByClass(student.class_id);
    }
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const materials = await materialRepo.findForStudent(student.id);
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFees = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const fees = await feeRepo.findByStudentId(student.id);
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadFeeChallan = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { buffer, filename } = await feeService.generateChallanPDF(feeId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const student = await getStudentId(req.user.id);
    const notices = await announcementRepo.findForUser('student', student.class_id);
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const db = Database.getInstance();
    const notifications = await db.all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.getInstance();
    await db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
