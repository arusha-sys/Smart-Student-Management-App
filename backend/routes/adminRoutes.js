const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes in this router require authentication and admin role
router.use(authenticate, authorize(['admin']));

// Dashboard
router.get('/dashboard-stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/block', adminController.toggleBlockUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.delete('/users/:id', adminController.deleteUser);

// Courses
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.patch('/courses/:id/assign', adminController.assignCourseTeacher);
router.delete('/courses/:id', adminController.deleteCourse);

// Classes
router.get('/classes', adminController.getClasses);
router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);

// Timetable
router.get('/timetable', adminController.getTimetable);
router.post('/timetable', adminController.createTimetable);
router.delete('/timetable/:id', adminController.deleteTimetable);

// Fees
router.get('/fees', adminController.getFees);
router.post('/fees', adminController.createFeeVoucher);
router.patch('/fees/:id/status', adminController.updateFeeStatus);

// Announcements
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

module.exports = router;
