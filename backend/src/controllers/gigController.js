const Gig = require('../models/Gig');
const Notification = require('../models/Notification');

/**
 * Post a new gig (Client only)
 */
exports.createGig = async (req, res) => {
  try {
    const { title, description, category, skillsRequired, budgetMin, budgetMax, location, milestones, attachments } = req.body;

    if (!title || !description || !category || !skillsRequired || !budgetMin || !budgetMax || !location) {
      return res.status(400).json({ success: false, message: 'All general fields are required' });
    }

    if (req.user.role !== 'client') {
      return res.status(403).json({ success: false, message: 'Only clients are allowed to create gigs' });
    }

    const gig = await Gig.create({
      client: req.user._id,
      title,
      description,
      category,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(s => s.trim()),
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      location,
      milestones: milestones || [],
      attachments: attachments || [],
    });

    res.status(201).json({
      success: true,
      message: 'Gig posted successfully!',
      gig,
    });
  } catch (error) {
    console.error('Create gig error:', error);
    res.status(500).json({ success: false, message: 'Could not create gig' });
  }
};

/**
 * Get single gig details
 */
exports.getGigDetails = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('client', 'name email status');
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    res.status(200).json({
      success: true,
      gig,
    });
  } catch (error) {
    console.error('Get gig error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch gig details' });
  }
};

/**
 * Get all gigs with advanced query filters
 */
exports.getAllGigs = async (req, res) => {
  try {
    const { search, category, location, skills, minBudget, maxBudget } = req.query;

    // Base query: Only show open gigs
    let queryObject = { status: 'open' };

    // Regex text search on title or description
    if (search) {
      queryObject.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      queryObject.category = category;
    }

    // Hyperlocal Location Filter (regex for flexible local search matching)
    if (location) {
      queryObject.location = { $regex: location, $options: 'i' };
    }

    // Skills filter (matching any skills listed in query parameter)
    if (skills) {
      const skillsList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
      queryObject.skillsRequired = { $in: skillsList.map(skill => new RegExp(skill, 'i')) };
    }

    // Budget range filters
    if (minBudget || maxBudget) {
      queryObject.budgetMin = {};
      queryObject.budgetMax = {};

      if (minBudget) {
        queryObject.budgetMin.$gte = Number(minBudget);
      }
      if (maxBudget) {
        queryObject.budgetMax.$lte = Number(maxBudget);
      }
      
      // Clean up empty filters
      if (Object.keys(queryObject.budgetMin).length === 0) delete queryObject.budgetMin;
      if (Object.keys(queryObject.budgetMax).length === 0) delete queryObject.budgetMax;
    }

    // Fetch matching gigs, sorting by newest first
    const gigs = await Gig.find(queryObject)
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gigs.length,
      gigs,
    });
  } catch (error) {
    console.error('Get all gigs error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch marketplace gigs' });
  }
};

/**
 * Update gig (Client only, restricted to owner)
 */
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this gig' });
    }

    const { title, description, category, skillsRequired, budgetMin, budgetMax, location, milestones, status } = req.body;

    if (title) gig.title = title;
    if (description) gig.description = description;
    if (category) gig.category = category;
    if (skillsRequired) {
      gig.skillsRequired = Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(s => s.trim());
    }
    if (budgetMin !== undefined) gig.budgetMin = Number(budgetMin);
    if (budgetMax !== undefined) gig.budgetMax = Number(budgetMax);
    if (location) gig.location = location;
    if (milestones) gig.milestones = milestones;
    if (status) gig.status = status;

    await gig.save();

    res.status(200).json({
      success: true,
      message: 'Gig details updated successfully',
      gig,
    });
  } catch (error) {
    console.error('Update gig error:', error);
    res.status(500).json({ success: false, message: 'Could not update gig' });
  }
};

/**
 * Invite a freelancer to apply for a gig (Client only)
 */
exports.inviteFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    const { freelancerId } = req.body;

    if (!freelancerId) {
      return res.status(400).json({ success: false, message: 'Freelancer ID is required' });
    }

    const gig = await Gig.findById(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to invite freelancers to this gig' });
    }

    if (gig.invitedFreelancers.includes(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Freelancer is already invited to this gig' });
    }

    gig.invitedFreelancers.push(freelancerId);
    await gig.save();

    await Notification.create({
      user: freelancerId,
      type: 'system',
      message: `Client ${req.user.name} has invited you to apply for their project "${gig.title}"!`,
      relatedId: gig._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Freelancer invited successfully!',
      gig,
    });
  } catch (error) {
    console.error('Invite freelancer error:', error);
    res.status(500).json({ success: false, message: 'Could not process invitation' });
  }
};

/**
 * Update milestone status (Submitting work for freelancer, approving for client)
 */
exports.updateMilestoneStatus = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { status, submissionNotes, submissionUrl } = req.body;

    const gig = await Gig.findById(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const Proposal = require('../models/Proposal');
    const acceptedProposal = await Proposal.findOne({ gig: id, status: 'accepted' });

    const isClient = gig.client.toString() === req.user._id.toString();
    const isFreelancer = acceptedProposal && acceptedProposal.freelancer.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this milestone' });
    }

    if (isFreelancer && status === 'completed') {
      milestone.status = 'completed';
      milestone.submissionNotes = submissionNotes || '';
      milestone.submissionUrl = submissionUrl || '';
      milestone.submittedAt = new Date();
    } else if (isClient && status === 'approved') {
      milestone.status = 'approved';
    } else {
      milestone.status = status;
    }

    const allApproved = gig.milestones.every(m => m.status === 'approved');
    if (allApproved) {
      gig.status = 'completed';
    }

    await gig.save();

    res.status(200).json({
      success: true,
      message: `Milestone status updated successfully to ${status}`,
      gig
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ success: false, message: 'Failed to update milestone status' });
  }
};

/**
 * Get current user's projects/contracts
 */
exports.getMyProjects = async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const gigs = await Gig.find({ client: req.user._id })
        .populate('client', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        gigs,
      });
    } else if (req.user.role === 'freelancer') {
      const Proposal = require('../models/Proposal');
      const acceptedProposals = await Proposal.find({ freelancer: req.user._id, status: 'accepted' });
      const gigIds = acceptedProposals.map(p => p.gig);

      const gigs = await Gig.find({ _id: { $in: gigIds } })
        .populate('client', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        gigs,
      });
    }

    res.status(400).json({ success: false, message: 'Invalid role' });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve projects' });
  }
};
