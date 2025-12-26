const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    Phone: {
      type: String,
      trim: true,
    },
    Company: {
      type: String,
      trim: true,
    },
    Subject: {
      type: String,
      trim: true,
    },
    Message: {
      type: String,
      required: true,
      trim: true,
    },
    Type: {
      type: String,
      enum: ['sponsor', 'general', 'support', 'partnership'],
      default: 'sponsor',
    },
    Status: {
      type: String,
      enum: ['new', 'contacted', 'replied', 'resolved', 'archived'],
      default: 'new',
    },
    IsReachedOut: {
      type: Boolean,
      default: false,
    },
    ReachedOutAt: {
      type: Date,
    },
    ReachedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    Notes: {
      type: String,
      trim: true,
    },
    AdminNotes: [
      {
        Note: {
          type: String,
          required: true,
          trim: true,
        },
        CreatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    Priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    Source: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
contactSchema.index({ Status: 1, createdAt: -1 });
contactSchema.index({ Type: 1, Status: 1 });
contactSchema.index({ Email: 1 });

module.exports = mongoose.model('Contact', contactSchema);

