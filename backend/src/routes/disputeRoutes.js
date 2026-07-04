const express = require('express');
const disputeController = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, disputeController.raiseDispute);
router.get('/my-disputes', protect, disputeController.getMyDisputes);

module.exports = router;
