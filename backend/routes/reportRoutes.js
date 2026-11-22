const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize(['admin', 'teacher']));

router.get('/:type', reportController.getReportData);
router.get('/:type/export', reportController.exportReport);

module.exports = router;
