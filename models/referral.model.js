const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    Referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ReferredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ReferralCode: {
      type: String,
      required: true,
    },
    Earnings: {
      type: Number,
      default: 0,
    },
    Status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    Notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
referralSchema.index({ Referrer: 1 });
referralSchema.index({ ReferredUser: 1 });
referralSchema.index({ ReferralCode: 1 });

module.exports = mongoose.model('Referral', referralSchema);

