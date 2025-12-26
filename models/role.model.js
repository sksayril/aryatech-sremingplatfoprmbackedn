const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    Slug: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values for unique index
      lowercase: true,
      trim: true,
    },
    Description: {
      type: String,
    },
    Permissions: [
      {
        type: String,
        required: true,
      },
    ],
    IsActive: {
      type: Boolean,
      default: true,
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

// Generate slug before saving (always generate from Name if not provided)
roleSchema.pre('save', async function (next) {
  // Always generate slug from Name if Slug is not set or Name has changed
  if (this.Name && (!this.Slug || this.isModified('Name'))) {
    let slug = this.Name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Ensure slug is unique by appending a number if needed
    if (this.isNew || this.isModified('Name')) {
      const Role = this.constructor;
      let uniqueSlug = slug;
      let counter = 1;
      
      // Check if slug exists (excluding current document)
      let existingRole = await Role.findOne({ Slug: uniqueSlug, _id: { $ne: this._id } });
      while (existingRole) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
        existingRole = await Role.findOne({ Slug: uniqueSlug, _id: { $ne: this._id } });
      }
      slug = uniqueSlug;
    }
    
    this.Slug = slug;
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema);


