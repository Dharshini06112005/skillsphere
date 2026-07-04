const Review = require('../models/Review');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Profile = require('../models/Profile');

/**
 * Submit a review
 */
exports.submitReview = async (req, res) => {
  try {
    const { gigId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    if (!gigId || !revieweeId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'All review fields are required' });
    }

    if (reviewerId.toString() === revieweeId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot write a review for yourself' });
    }

    // 1. Verify Gig exists and check association
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Determine weight based on reviewer's reputation
    const reviewerProfile = await Profile.findOne({ user: reviewerId });
    let reputationWeight = 1.0;
    
    if (reviewerProfile && reviewerProfile.reputationScore !== undefined) {
      // Scale weight dynamically based on reputation rating (e.g. rating/5)
      reputationWeight = Math.max(0.5, reviewerProfile.reputationScore / 5.0 || 1.0);
    }

    // 2. Prevent duplicate reviews
    const duplicateReview = await Review.findOne({
      gig: gigId,
      reviewer: reviewerId,
      reviewee: revieweeId,
    });

    if (duplicateReview) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this gig' });
    }

    // 3. Create Review
    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      gig: gigId,
      rating: Number(rating),
      comment,
      reputationWeight,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted and reputation score updated!',
      review,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Could not submit review' });
  }
};

/**
 * Get reviews received by a user
 */
exports.getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name email role')
      .populate('gig', 'title description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch user reviews' });
  }
};
