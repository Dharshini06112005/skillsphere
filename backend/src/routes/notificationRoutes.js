const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, notificationController.getMyNotifications);
router.put('/read', protect, notificationController.markNotificationsAsRead);

module.exports = router;
