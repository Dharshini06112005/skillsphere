const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');

/**
 * Submit a proposal (Freelancer only)
 */
exports.submitProposal = async (req, res) => {
  try {
    const { gigId, description, bidAmount, completionTime } = req.body;

    if (!gigId || !description || !bidAmount || !completionTime) {
      return res.status(400).json({ success: false, message: 'All bidding fields are required' });
    }

    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ success: false, message: 'Only freelancers can submit proposals' });
    }

    // Check if gig is open
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This gig is no longer accepting proposals' });
    }

    // Check if proposal already exists
    const existingProposal = await Proposal.findOne({ gig: gigId, freelancer: req.user._id });
    if (existingProposal) {
      return res.status(400).json({ success: false, message: 'You have already submitted a proposal for this gig' });
    }

    // Create Proposal
    const proposal = await Proposal.create({
      gig: gigId,
      freelancer: req.user._id,
      description,
      bidAmount: Number(bidAmount),
      completionTime: Number(completionTime),
    });

    // Increment proposal count on Gig
    gig.proposalsCount = gig.proposalsCount + 1;
    await gig.save();

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully!',
      proposal,
    });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ success: false, message: 'Could not submit proposal' });
  }
};

/**
 * Get proposals for a gig (Owner Client only)
 */
exports.getGigProposals = async (req, res) => {
  try {
    const { gigId } = req.params;

    // Check if gig belongs to the requesting client
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view proposals for this gig' });
    }

    const proposals = await Proposal.find({ gig: gigId })
      .populate('freelancer', 'name email status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      proposals,
    });
  } catch (error) {
    console.error('Get gig proposals error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch gig proposals' });
  }
};

/**
 * Get freelancer's own proposals
 */
exports.getFreelancerProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate({
        path: 'gig',
        select: 'title description budgetMin budgetMax location status client',
        populate: { path: 'client', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      proposals,
    });
  } catch (error) {
    console.error('Get freelancer proposals error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch your proposals' });
  }
};

/**
 * Update proposal status (Client owner only)
 */
exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted', 'rejected', 'negotiating'
    const { id } = req.params;

    if (!['accepted', 'rejected', 'negotiating'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const proposal = await Proposal.findById(id).populate('gig');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Verify requesting client owns the gig
    if (proposal.gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this proposal' });
    }

    proposal.status = status;
    await proposal.save();

    // If proposal is accepted, mark gig as in_progress and reject other pending proposals
    if (status === 'accepted') {
      const gig = await Gig.findById(proposal.gig._id);
      gig.status = 'in_progress';
      await gig.save();

      // Reject all other proposals for this gig
      await Proposal.updateMany(
        { gig: gig._id, _id: { $ne: proposal._id }, status: 'pending' },
        { status: 'rejected' }
      );
    }

    res.status(200).json({
      success: true,
      message: `Proposal status updated to ${status}`,
      proposal,
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ success: false, message: 'Could not update proposal status' });
  }
};
