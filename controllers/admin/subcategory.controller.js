const SubCategory = require('../../models/subcategory.model');

/**
 * Create subcategory
 */
exports.createSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'SubCategory created successfully',
      data: subCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create subcategory',
      error: error.message,
    });
  }
};

/**
 * Get all subcategories
 */
exports.getAllSubCategories = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};

    if (category) query.Category = category;
    if (isActive !== undefined) query.IsActive = isActive === 'true';

    const subCategories = await SubCategory.find(query)
      .populate('Category', 'Name Slug')
      .sort({ SortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message,
    });
  }
};

/**
 * Get subcategory by ID
 */
exports.getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id).populate('Category', 'Name Slug');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubCategory not found',
      });
    }

    res.json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategory',
      error: error.message,
    });
  }
};

/**
 * Update subcategory
 */
exports.updateSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubCategory not found',
      });
    }

    res.json({
      success: true,
      message: 'SubCategory updated successfully',
      data: subCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update subcategory',
      error: error.message,
    });
  }
};

/**
 * Delete subcategory
 */
exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubCategory not found',
      });
    }

    res.json({
      success: true,
      message: 'SubCategory deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete subcategory',
      error: error.message,
    });
  }
};

