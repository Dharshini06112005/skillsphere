const User = require('../models/User');
const Profile = require('../models/Profile');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const Gig = require('../models/Gig');

/**
 * Get all users list (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    const profiles = await Profile.find({ user: { $in: users.map(u => u._id) } });
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.user.toString()] = p.verificationBadge;
    });

    const usersWithVerification = users.map(u => {
      const uObj = u.toObject();
      uObj.isVerifiedFreelancer = profileMap[u._id.toString()] || false;
      return uObj;
    });

    res.status(200).json({ success: true, count: usersWithVerification.length, users: usersWithVerification });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch users list' });
  }
};

/**
 * Suspend or activate a user account
 */
exports.toggleUserSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an administrator account' });
    }

    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User has been successfully ${user.status === 'active' ? 'activated' : 'suspended'}.`,
      user,
    });
  } catch (error) {
    console.error('Toggle suspension error:', error);
    res.status(500).json({ success: false, message: 'Could not update user account status' });
  }
};

/**
 * Verify / approve freelancer profile badge
 */
exports.toggleFreelancerVerification = async (req, res) => {
  try {
    const { id } = req.params; // User ID

    const profile = await Profile.findOne({ user: id }).populate('user');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    if (profile.user?.role !== 'freelancer') {
      return res.status(400).json({ success: false, message: 'Only freelancer profiles can be verified' });
    }

    profile.verificationBadge = !profile.verificationBadge;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Freelancer verification has been ${profile.verificationBadge ? 'approved' : 'revoked'}.`,
      profile,
    });
  } catch (error) {
    console.error('Toggle verification error:', error);
    res.status(500).json({ success: false, message: 'Could not update freelancer verification status' });
  }
};

/**
 * Get all dispute tickets
 */
exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('gig', 'title description')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    // Calculate actual total platform transaction volume dynamically
    const transactions = await Transaction.find({ status: { $in: ['released', 'escrow_locked'] } });
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
      totalVolume
    });
  } catch (error) {
    console.error('Admin get disputes error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch disputes' });
  }
};

/**
 * Mediate and resolve dispute ticket
 */
exports.resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body; // 'refund_client' or 'release_freelancer'

    if (!['refund_client', 'release_freelancer'].includes(resolution)) {
      return res.status(400).json({ success: false, message: 'Invalid resolution option' });
    }

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute ticket not found' });
    }

    if (dispute.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This dispute is already resolved' });
    }

    // Locate related transaction and gig
    const transaction = await Transaction.findOne({
      gig: dispute.gig,
      milestoneId: dispute.milestoneId,
      status: 'escrow_locked',
    });

    const gig = await Gig.findById(dispute.gig);
    const milestone = gig ? gig.milestones.id(dispute.milestoneId) : null;

    if (resolution === 'refund_client') {
      // 1. Mark transaction as refunded
      if (transaction) {
        transaction.status = 'refunded';
        await transaction.save();
      }

      // 2. Reset milestone status inside Gig
      if (milestone) {
        milestone.status = 'pending'; // funds returned to client; milestone reset
        await gig.save();
      }

      dispute.status = 'resolved_refunded';
      await dispute.save();

    } else if (resolution === 'release_freelancer') {
      // 1. Release escrow funds
      if (transaction) {
        transaction.status = 'released';
        await transaction.save();
      }

      // 2. Mark milestone as approved
      if (milestone) {
        milestone.status = 'approved';
        await gig.save();
      }

      dispute.status = 'resolved_released';
      await dispute.save();
    }

    res.status(200).json({
      success: true,
      message: `Dispute ticket resolved successfully: ${resolution.replace('_', ' ')}.`,
      dispute,
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
};
