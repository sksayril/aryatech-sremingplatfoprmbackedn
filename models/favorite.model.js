const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate favorites
favoriteSchema.index({ User: 1, Movie: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

