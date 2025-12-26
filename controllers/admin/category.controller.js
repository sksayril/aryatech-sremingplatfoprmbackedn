const Category = require('../../models/category.model');
const { deleteFromS3, extractKeyFromUrl, uploadToS3 } = require('../../services/s3.service');
const { S3_BUCKETS } = require('../../config/constants');

/**
 * Create category
 */
exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };

    if (req.files && req.files.image && req.files.image[0]) {
      const uploadResult = await uploadToS3(req.files.image[0], S3_BUCKETS.THUMBNAILS);
      categoryData.Image = uploadResult.url;
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.IsActive = isActive === 'true';
    }

    const categories = await Category.find(query).sort({ SortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message,
    });
  }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (req.files && req.files.image && req.files.image[0]) {
      if (category.Image) {
        const key = extractKeyFromUrl(category.Image);
        if (key) await deleteFromS3(key);
      }
      const uploadResult = await uploadToS3(req.files.image[0], S3_BUCKETS.THUMBNAILS);
      req.body.Image = uploadResult.url;
    }

    Object.assign(category, req.body);
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (category.Image) {
      const key = extractKeyFromUrl(category.Image);
      if (key) await deleteFromS3(key);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message,
    });
  }
};

