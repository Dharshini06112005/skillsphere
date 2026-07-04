const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide proposal cover details'],
    },
    bidAmount: {
      type: Number,
      required: [true, 'Please provide a bid amount'],
      min: [0, 'Bid amount must be positive'],
    },
    completionTime: {
      type: Number,
      required: [true, 'Please provide estimated completion time in days'],
      min: [1, 'Completion time must be at least 1 day'],
    },
    status: {
      type: String,
      enum: ['pending', 'negotiating', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple proposals from the same freelancer on the same gig
proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

const Proposal = mongoose.model('Proposal', proposalSchema);
module.exports = Proposal;
