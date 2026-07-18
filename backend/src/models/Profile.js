const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Freelancer specific fields
    skills: [
      {
        name: { type: String, required: true },
        level: { 
          type: String, 
          enum: ['beginner', 'intermediate', 'expert'], 
          default: 'intermediate' 
        }
      }
    ],
    portfolio: [
      {
        title: { type: String, required: true },
        description: String,
        link: String,
        imageUrl: String,
      }
    ],
    resumeUrl: String,
    certifications: [
      {
        name: { type: String, required: true },
        issuingOrganization: String,
        issueDate: Date,
        credentialUrl: String,
      }
    ],
    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        startDate: Date,
        endDate: Date,
        description: String,
        current: { type: Boolean, default: false },
      }
    ],
    availability: {
      type: String,
      enum: ['available', 'busy', 'part-time'],
      default: 'available',
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    verificationBadge: {
      type: Boolean,
      default: false,
    },
    // Client specific fields
    companyName: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    billingAddress: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    availabilitySlots: [
      {
        day: { type: String, required: true }, // e.g. "Monday", "Tuesday"
        startHour: { type: String, required: true }, // e.g. "09:00"
        endHour: { type: String, required: true } // e.g. "12:00"
      }
    ],
    bookings: [
      {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        clientName: String,
        day: String,
        timeSlot: String, // e.g. "09:00 - 10:00"
        status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;
