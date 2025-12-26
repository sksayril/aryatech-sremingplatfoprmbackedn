const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    Movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    WatchedDuration: {
      type: Number, // in seconds
      default: 0,
    },
    TotalDuration: {
      type: Number, // in seconds
    },
    Quality: {
      type: String,
    },
    LastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    IsCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
watchHistorySchema.index({ User: 1, Movie: 1 }, { unique: true });
watchHistorySchema.index({ User: 1, LastWatchedAt: -1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);

