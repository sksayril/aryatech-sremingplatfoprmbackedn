const mongoose = require('mongoose');

const subSubCategorySchema = new mongoose.Schema(
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
    SubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
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
subSubCategorySchema.pre('save', function (next) {
  if (this.isModified('Name') && !this.Slug) {
    const slugify = require('slugify');
    this.Slug = slugify(this.Name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('SubSubCategory', subSubCategorySchema);

