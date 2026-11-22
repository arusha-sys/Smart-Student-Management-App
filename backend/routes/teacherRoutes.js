const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize(['teacher']));

router.get('/dashboard-stats', teacherController.getDashboardStats);
router.get('/courses', teacherController.getAssignedCourses);
router.get('/courses/:courseId/students', teacherController.getCourseStudents);

// Attendance
router.get('/courses/:courseId/attendance', teacherController.getAttendanceByDate);
router.post('/attendance', teacherController.markAttendance);

// Marks & Grades
router.get('/courses/:courseId/marks', teacherController.getCourseMarks);
router.post('/marks', teacherController.enterMarks);

// Assignments & Submissions
router.get('/assignments', teacherController.getAssignments);
router.post('/assignments', teacherController.createAssignment);
router.get('/assignments/:assignmentId/submissions', teacherController.getAssignmentSubmissions);
router.post('/submissions/:submissionId/grade', teacherController.gradeSubmission);

// Course Materials
router.get('/courses/:courseId/materials', teacherController.getMaterials);
router.post('/materials', teacherController.uploadMaterial);

// Notices
router.post('/notices', teacherController.sendCourseNotice);

module.exports = router;
