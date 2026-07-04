const Transaction = require('../models/Transaction');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');

/**
 * Simulate checkout and lock milestone funds in escrow
 */
exports.checkoutMilestone = async (req, res) => {
  try {
    const { gigId, milestoneId } = req.body;

    if (!gigId || !milestoneId) {
      return res.status(400).json({ success: false, message: 'Gig ID and Milestone ID are required' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the posting client can make payments' });
    }

    // Find the milestone
    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (milestone.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This milestone has already been funded or processed' });
    }

    // Find the accepted proposal to retrieve the hired freelancer
    const proposal = await Proposal.findOne({ gig: gigId, status: 'accepted' });
    if (!proposal) {
      return res.status(400).json({ success: false, message: 'No accepted proposal found for this gig' });
    }

    // Generate mock payment references
    const crypto = require('crypto');
    const paymentId = 'pay_skillsphere_' + crypto.randomBytes(8).toString('hex');

    // Create Transaction (Escrow Lock)
    const transaction = await Transaction.create({
      client: req.user._id,
      freelancer: proposal.freelancer,
      gig: gigId,
      milestoneId,
      amount: milestone.amount,
      status: 'escrow_locked',
      paymentId,
    });

    // Update milestone status to funded / in_progress
    milestone.status = 'in_progress';
    await gig.save();

    res.status(201).json({
      success: true,
      message: 'Escrow payment locked successfully!',
      transaction,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Payment transaction failed' });
  }
};

/**
 * Get payment history logs
 */
exports.getTransactionsHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch transactions where current user is either client or freelancer
    const transactions = await Transaction.find({
      $or: [{ client: userId }, { freelancer: userId }],
    })
      .populate('gig', 'title description')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Get transactions history error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve ledger records' });
  }
};
