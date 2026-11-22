const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize(['student']));

router.get('/dashboard', studentController.getDashboard);
router.get('/courses', studentController.getEnrolledCourses);
router.get('/attendance', studentController.getAttendance);
router.get('/results', studentController.getResults);
router.get('/assignments', studentController.getAssignments);
router.post('/assignments/submit', studentController.submitAssignment);
router.get('/timetable', studentController.getTimetable);
router.get('/materials', studentController.getMaterials);
router.get('/fees', studentController.getFees);
router.get('/fees/:feeId/challan', studentController.downloadFeeChallan);
router.get('/notices', studentController.getNotices);
router.get('/notifications', studentController.getNotifications);
router.patch('/notifications/:id/read', studentController.markNotificationRead);

module.exports = router;
