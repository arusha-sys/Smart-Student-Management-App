const TeacherRepository = require('../repositories/TeacherRepository');
const CourseRepository = require('../repositories/CourseRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');
const MarkRepository = require('../repositories/MarkRepository');
const AssignmentRepository = require('../repositories/AssignmentRepository');
const SubmissionRepository = require('../repositories/SubmissionRepository');
const CourseMaterialRepository = require('../repositories/CourseMaterialRepository');
const AnnouncementRepository = require('../repositories/AnnouncementRepository');
const AttendanceService = require('../services/AttendanceService');
const GradingService = require('../services/GradingService');
const { notificationDispatcher } = require('../patterns/observers');

const teacherRepo = new TeacherRepository();
const courseRepo = new CourseRepository();
const attendanceRepo = new AttendanceRepository();
const markRepo = new MarkRepository();
const assignmentRepo = new AssignmentRepository();
const submissionRepo = new SubmissionRepository();
const materialRepo = new CourseMaterialRepository();
const announcementRepo = new AnnouncementRepository();
const attendanceService = new AttendanceService();
const gradingService = new GradingService();

// Helper to get teacher record ID from logged in user
async function getTeacherId(userId) {
  const teacher = await teacherRepo.findByUserId(userId);
  if (!teacher) throw new Error('Teacher record not found for this user account');
  return teacher.id;
}

exports.getDashboardStats = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const assignedCourses = await teacherRepo.getAssignedCourses(teacherId);
    const assignments = await assignmentRepo.findByTeacher(teacherId);

    res.json({
      success: true,
      stats: {
        totalCourses: assignedCourses.length,
        totalAssignments: assignments.length
      },
      assignedCourses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignedCourses = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const courses = await teacherRepo.getAssignedCourses(teacherId);
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const students = await courseRepo.getEnrolledStudents(courseId);
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Attendance
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const records = await attendanceRepo.findByCourseAndDate(courseId, queryDate);
    const enrolledStudents = await courseRepo.getEnrolledStudents(courseId);

    // Merge so all enrolled students show up in UI even if not yet marked
    const attendanceMap = new Map(records.map(r => [r.student_id, r]));
    const studentAttendanceList = enrolledStudents.map(s => {
      const rec = attendanceMap.get(s.id);
      return {
        student_id: s.id,
        name: s.name,
        reg_no: s.reg_no,
        roll_no: s.roll_no,
        status: rec ? rec.status : 'present',
        lecture_topic: rec ? rec.lecture_topic : '',
        marked: !!rec
      };
    });

    res.json({
      success: true,
      date: queryDate,
      records: studentAttendanceList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const { courseId, date, lectureTopic, studentRecords } = req.body;

    const saved = await attendanceService.recordCourseAttendance({
      courseId,
      date: date || new Date().toISOString().split('T')[0],
      lectureTopic,
      markedBy: teacherId,
      studentRecords,
      isTeacher: true // Enforces same-day edit rule
    });

    res.json({ success: true, message: 'Attendance recorded successfully', records: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Marks
exports.getCourseMarks = async (req, res) => {
  try {
    const { courseId } = req.params;
    const marks = await markRepo.getMarksByCourse(courseId);
    const enrolledStudents = await courseRepo.getEnrolledStudents(courseId);

    const markMap = new Map(marks.map(m => [m.student_id, m]));
    const mergedList = enrolledStudents.map(s => {
      const m = markMap.get(s.id);
      return {
        student_id: s.id,
        name: s.name,
        reg_no: s.reg_no,
        roll_no: s.roll_no,
        quiz: m ? m.quiz : 0,
        assignment: m ? m.assignment : 0,
        mid: m ? m.mid : 0,
        final: m ? m.final : 0,
        total: m ? m.total : 0,
        grade: m ? m.grade : 'F',
        gpa: m ? m.gpa : 0.0,
        grading_type: m ? m.grading_type : 'absolute'
      };
    });

    res.json({ success: true, marks: mergedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.enterMarks = async (req, res) => {
  try {
    const { courseId, marks, gradingType = 'absolute' } = req.body;
    const results = await gradingService.recordBatchCourseMarks(courseId, marks, gradingType);
    res.json({
      success: true,
      message: `Marks calculated and updated successfully via ${gradingType} GradingStrategy`,
      results
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assignments
exports.getAssignments = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const assignments = await assignmentRepo.findByTeacher(teacherId);
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const { course_id, title, description, deadline, max_marks } = req.body;

    const assignment = await assignmentRepo.create({
      course_id,
      teacher_id: teacherId,
      title,
      description,
      deadline,
      max_marks: max_marks || 100
    });

    // Notify enrolled students via Observer pattern
    await notificationDispatcher.notify('ASSIGNMENT_CREATED', {
      courseId: course_id,
      title: `New Assignment: ${title}`,
      message: `A new assignment has been uploaded. Deadline: ${deadline}`,
      type: 'info'
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await submissionRepo.findByAssignment(assignmentId);
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks_obtained, feedback } = req.body;

    const graded = await submissionRepo.gradeSubmission(submissionId, { marks_obtained, feedback });
    res.json({ success: true, message: 'Submission graded successfully', submission: graded });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Course Materials
exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const materials = await materialRepo.findByCourse(courseId);
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadMaterial = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.id);
    const { course_id, title, description, file_url } = req.body;

    const material = await materialRepo.create({
      course_id,
      teacher_id: teacherId,
      title,
      description,
      file_url
    });

    res.status(201).json({ success: true, material });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Course Notices
exports.sendCourseNotice = async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const course = await courseRepo.findById(courseId);

    const notice = await announcementRepo.create({
      title: `[${course ? course.code : 'Course'}] ${title}`,
      content,
      target_role: 'all', // visible
      target_class_id: course ? course.class_id : null,
      created_by: req.user.id
    });

    await notificationDispatcher.notify('ANNOUNCEMENT_CREATED', {
      courseId,
      title: `Notice from Instructor: ${title}`,
      message: content,
      classId: course ? course.class_id : null
    });

    res.status(201).json({ success: true, announcement: notice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
