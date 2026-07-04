const express = require('express');
const gigController = require('../controllers/gigController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes for browsing
router.get('/', gigController.getAllGigs);
router.get('/:id', gigController.getGigDetails);

// Private Client routes
router.post('/', protect, restrictTo('client'), gigController.createGig);
router.put('/:id', protect, restrictTo('client'), gigController.updateGig);

module.exports = router;
