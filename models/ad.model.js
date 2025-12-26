const mongoose = require('mongoose');
const { AD_TYPES } = require('../config/constants');

const adSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Type: {
      type: String,
      enum: Object.values(AD_TYPES),
      required: true,
    },
    // Media URLs
    ImageUrl: {
      type: String,
    },
    VideoUrl: {
      type: String,
    },
    // Ad Content
    Title: {
      type: String,
    },
    Description: {
      type: String,
    },
    ClickUrl: {
      type: String,
      required: true,
    },
    // Display Settings
    Position: {
      type: String, // 'top', 'bottom', 'center', etc.
    },
    Width: {
      type: Number,
    },
    Height: {
      type: Number,
    },
    // Timing for video ads
    StartTime: {
      type: Number, // seconds for mid-roll
    },
    Duration: {
      type: Number, // seconds
    },
    // Targeting
    TargetCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    TargetMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      },
    ],
    TargetCountries: [
      {
        type: String, // ISO country codes
      },
    ],
    // Status
    IsActive: {
      type: Boolean,
      default: true,
    },
    StartDate: {
      type: Date,
    },
    EndDate: {
      type: Date,
    },
    // Analytics
    Impressions: {
      type: Number,
      default: 0,
    },
    Clicks: {
      type: Number,
      default: 0,
    },
    // Brand/Advertiser Info
    AdvertiserName: {
      type: String,
    },
    AdvertiserEmail: {
      type: String,
    },
    // Priority/Weight for ad rotation
    Priority: {
      type: Number,
      default: 0,
    },
    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
adSchema.index({ Type: 1, IsActive: 1 });
adSchema.index({ StartDate: 1, EndDate: 1 });
adSchema.index({ Priority: -1 });

module.exports = mongoose.model('Ad', adSchema);

