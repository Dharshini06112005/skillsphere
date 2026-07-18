const express = require('express');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Private profile routes
router.get('/me', protect, profileController.getMyProfile);
router.put('/me', protect, profileController.updateMyProfile);

// Public profile routes (e.g. Clients browsing Freelancer profiles)
router.get('/freelancer/:id', profileController.getPublicFreelancerProfile);
router.post('/freelancer/:id/book', protect, profileController.bookFreelancerSlot);

module.exports = router;
