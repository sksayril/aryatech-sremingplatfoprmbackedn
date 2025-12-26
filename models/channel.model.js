const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    Description: {
      type: String,
    },
    Logo: {
      type: String,
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    SortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
channelSchema.pre('save', function (next) {
  if (this.isModified('Name') && !this.Slug) {
    const slugify = require('slugify');
    this.Slug = slugify(this.Name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Channel', channelSchema);

