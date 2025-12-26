const mongoose = require('mongoose');
const slugify = require('slugify');

const actorSchema = new mongoose.Schema(
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
      trim: true,
    },
    Image: {
      type: String, // S3 URL for actor image
    },
    DateOfBirth: {
      type: Date,
    },
    Nationality: {
      type: String,
      trim: true,
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
actorSchema.pre('save', function (next) {
  if (this.isModified('Name') && !this.Slug) {
    this.Slug = slugify(this.Name, { lower: true, strict: true });
  }
  next();
});

// Index for search
actorSchema.index({ Name: 'text', Description: 'text' });
actorSchema.index({ IsActive: 1, SortOrder: 1 });

module.exports = mongoose.model('Actor', actorSchema);

