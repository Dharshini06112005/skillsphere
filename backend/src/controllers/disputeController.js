const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const Gig = require('../models/Gig');

/**
 * File/Raise a dispute ticket
 */
exports.raiseDispute = async (req, res) => {
  try {
    const { gigId, milestoneId, reason } = req.body;
    const userId = req.user._id;

    if (!gigId || !milestoneId || !reason) {
      return res.status(400).json({ success: false, message: 'Gig, milestone and reason are required' });
    }

    // Verify there is an active escrow transaction locked for this milestone
    const transaction = await Transaction.findOne({
      gig: gigId,
      milestoneId,
      status: 'escrow_locked',
    });

    if (!transaction) {
      return res.status(400).json({ success: false, message: 'No active escrowed transaction found for this milestone' });
    }

    // Check if user is associated with this transaction
    if (
      transaction.client.toString() !== userId.toString() &&
      transaction.freelancer.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to raise a dispute for this milestone' });
    }

    // Check if dispute already filed
    const existingDispute = await Dispute.findOne({ gig: gigId, milestoneId, status: 'pending' });
    if (existingDispute) {
      return res.status(400).json({ success: false, message: 'A dispute is already pending for this milestone' });
    }

    // Create Dispute ticket
    const dispute = await Dispute.create({
      gig: gigId,
      client: transaction.client,
      freelancer: transaction.freelancer,
      milestoneId,
      raisedBy: userId,
      reason,
      amount: transaction.amount,
    });

    res.status(201).json({
      success: true,
      message: 'Dispute raised successfully! Administrator mediation has been initiated.',
      dispute,
    });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ success: false, message: 'Could not raise dispute ticket' });
  }
};

/**
 * Get user disputes
 */
exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ client: req.user._id }, { freelancer: req.user._id }],
    })
      .populate('gig', 'title description')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      disputes,
    });
  } catch (error) {
    console.error('Get my disputes error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch disputes list' });
  }
};
