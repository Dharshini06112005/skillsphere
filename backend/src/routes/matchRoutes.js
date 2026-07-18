const express = require('express');
const matchController = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/trending-skills', protect, matchController.getTrendingSkills);
router.get('/recommendations/:gigId', protect, matchController.getRecommendations);

module.exports = router;
