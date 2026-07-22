const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a gig title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a gig description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category for this gig'],
      trim: true,
    },
    skillsRequired: {
      type: [String],
      required: [true, 'Please provide required skills'],
    },
    budgetMin: {
      type: Number,
      required: [true, 'Please provide a minimum budget'],
      min: [0, 'Budget must be positive'],
    },
    budgetMax: {
      type: Number,
      required: [true, 'Please provide a maximum budget'],
      min: [0, 'Budget must be positive'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location for hyperlocal matching'],
      trim: true,
    },
    milestones: [
      {
        title: { type: String, required: true },
        description: String,
        amount: { type: Number, required: true, min: 0 },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'approved'],
          default: 'pending',
        },
        submissionNotes: String,
        submissionUrl: String,
        submittedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    proposalsCount: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true }
      }
    ],
    invitedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Gig = mongoose.model('Gig', gigSchema);
module.exports = Gig;
