const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    Movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    Comment: {
      type: String,
      required: true,
      trim: true,
    },
    Likes: {
      type: Number,
      default: 0,
    },
    LikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    IsEdited: {
      type: Boolean,
      default: false,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    Replies: [
      {
        User: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        Comment: {
          type: String,
          required: true,
        },
        Likes: {
          type: Number,
          default: 0,
        },
        LikedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
commentSchema.index({ Movie: 1, createdAt: -1 });
commentSchema.index({ User: 1 });

module.exports = mongoose.model('Comment', commentSchema);

