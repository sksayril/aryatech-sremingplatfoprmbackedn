const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
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
    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    Description: {
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
subCategorySchema.pre('save', function (next) {
  if (this.isModified('Name') && !this.Slug) {
    const slugify = require('slugify');
    this.Slug = slugify(this.Name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('SubCategory', subCategorySchema);

