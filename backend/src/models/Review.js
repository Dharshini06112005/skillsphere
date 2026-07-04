const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
    },
    reputationWeight: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only review another user once per gig
reviewSchema.index({ gig: 1, reviewer: 1, reviewee: 1 }, { unique: true });

// Static method to calculate average ratings and reputation score
reviewSchema.statics.calcAverageRatings = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { reviewee: userId },
    },
    {
      $group: {
        _id: '$reviewee',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        weightedRatingSum: { $sum: { $multiply: ['$rating', '$reputationWeight'] } },
        weightSum: { $sum: '$reputationWeight' }
      },
    },
  ]);

  const Profile = mongoose.model('Profile');

  if (stats.length > 0) {
    // Weighted Average Calculation
    const weightedAvg = stats[0].weightedRatingSum / stats[0].weightSum;

    await Profile.findOneAndUpdate(
      { user: userId },
      {
        hourlyRate: undefined, // ensure we don't clear hourly rate, just update stats
      }
    );
    
    // We update fields on profile dynamically
    const profile = await Profile.findOne({ user: userId });
    if (profile) {
      // Add custom temporary variables or update profile schema dynamically
      profile.set('rating', parseFloat(stats[0].avgRating.toFixed(2)), { strict: false });
      profile.set('reputationScore', parseFloat(weightedAvg.toFixed(2)), { strict: false });
      profile.set('reviewCount', stats[0].nRating, { strict: false });
      await profile.save();
    }
  } else {
    const profile = await Profile.findOne({ user: userId });
    if (profile) {
      profile.set('rating', 0, { strict: false });
      profile.set('reputationScore', 0, { strict: false });
      profile.set('reviewCount', 0, { strict: false });
      await profile.save();
    }
  }
};

// Calculate ratings on review creation/save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.reviewee);
});

// Calculate ratings on review modification/deletion
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.reviewee);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
