const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/checkout', protect, restrictTo('client'), paymentController.checkoutMilestone);
router.get('/history', protect, paymentController.getTransactionsHistory);
router.post('/release', protect, paymentController.releasePayment);
router.post('/refund', protect, paymentController.refundPayment);

module.exports = router;
