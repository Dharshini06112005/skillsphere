const Profile = require('../models/Profile');
const User = require('../models/User');

/**
 * Get current user profile
 */
exports.getMyProfile = async (req, res) => {
  try {
    // req.user is attached by protect middleware
    let profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role isEmailVerified status createdAt'
    );

    if (!profile) {
      // Create profile dynamically if not found
      profile = await Profile.create({ user: req.user._id });
      profile = await Profile.findOne({ user: req.user._id }).populate(
        'user',
        'name email role isEmailVerified status createdAt'
      );
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

/**
 * Update current user profile
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Find profile
    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update name in User document if passed
    if (req.body.name) {
      await User.findByIdAndUpdate(req.user._id, { name: req.body.name });
    }

    // Role-based updates
    if (userRole === 'freelancer') {
      // Freelancer fields
      const { 
        skills, 
        portfolio, 
        resumeUrl, 
        certifications, 
        experience, 
        availability, 
        hourlyRate,
        bio
      } = req.body;

      if (skills !== undefined) profile.skills = skills;
      if (portfolio !== undefined) profile.portfolio = portfolio;
      if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
      if (certifications !== undefined) profile.certifications = certifications;
      if (experience !== undefined) profile.experience = experience;
      if (availability !== undefined) profile.availability = availability;
      if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
      if (bio !== undefined) profile.bio = bio;

    } else if (userRole === 'client') {
      // Client fields
      const { 
        companyName, 
        industry, 
        billingAddress, 
        website,
        bio 
      } = req.body;

      if (companyName !== undefined) profile.companyName = companyName;
      if (industry !== undefined) profile.industry = industry;
      if (billingAddress !== undefined) profile.billingAddress = billingAddress;
      if (website !== undefined) profile.website = website;
      if (bio !== undefined) profile.bio = bio;
    }

    await profile.save();

    // Retrieve full profile details with populated user fields
    const updatedProfile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role isEmailVerified status'
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * Get any freelancer's profile (Public route for clients to search/discover)
 */
exports.getPublicFreelancerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({ user: id })
      .populate('user', 'name email role status')
      .exec();

    if (!profile || profile.user.role !== 'freelancer') {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found' });
    }

    if (profile.user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This user profile is inactive' });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch profile' });
  }
};
