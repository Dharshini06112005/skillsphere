const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here are restricted to administrators
router.use(protect, restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/suspend', adminController.toggleUserSuspension);
router.put('/users/:id/verify', adminController.toggleFreelancerVerification);

router.get('/disputes', adminController.getAllDisputes);
router.put('/disputes/:id/resolve', adminController.resolveDispute);

module.exports = router;
