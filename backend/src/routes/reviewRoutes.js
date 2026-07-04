const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, reviewController.submitReview);
router.get('/user/:userId', reviewController.getUserReviews);

module.exports = router;
