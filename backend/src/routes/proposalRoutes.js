const express = require('express');
const proposalController = require('../controllers/proposalController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Freelancer routes
router.post('/', protect, restrictTo('freelancer'), proposalController.submitProposal);
router.get('/my-proposals', protect, restrictTo('freelancer'), proposalController.getFreelancerProposals);

// Protected Client routes
router.get('/gig/:gigId', protect, restrictTo('client'), proposalController.getGigProposals);
router.put('/:id/status', protect, restrictTo('client'), proposalController.updateProposalStatus);
router.put('/:id/negotiate', protect, proposalController.negotiateProposal);

module.exports = router;
