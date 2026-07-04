const express = require('express');
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/rooms', protect, chatController.getChatRooms);
router.get('/history/:roomId', protect, chatController.getChatHistory);

module.exports = router;
