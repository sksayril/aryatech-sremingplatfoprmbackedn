const SubSubCategory = require('../../models/subsubcategory.model');

/**
 * Create sub-subcategory
 */
exports.createSubSubCategory = async (req, res) => {
  try {
    const subSubCategory = await SubSubCategory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'SubSubCategory created successfully',
      data: subSubCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create sub-subcategory',
      error: error.message,
    });
  }
};

/**
 * Get all sub-subcategories
 */
exports.getAllSubSubCategories = async (req, res) => {
  try {
    const { subCategory, isActive } = req.query;
    const query = {};

    if (subCategory) query.SubCategory = subCategory;
    if (isActive !== undefined) query.IsActive = isActive === 'true';

    const subSubCategories = await SubSubCategory.find(query)
      .populate('SubCategory', 'Name Slug')
      .sort({ SortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: subSubCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-subcategories',
      error: error.message,
    });
  }
};

/**
 * Get sub-subcategory by ID
 */
exports.getSubSubCategoryById = async (req, res) => {
  try {
    const subSubCategory = await SubSubCategory.findById(req.params.id)
      .populate('SubCategory', 'Name Slug');

    if (!subSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubSubCategory not found',
      });
    }

    res.json({
      success: true,
      data: subSubCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-subcategory',
      error: error.message,
    });
  }
};

/**
 * Update sub-subcategory
 */
exports.updateSubSubCategory = async (req, res) => {
  try {
    const subSubCategory = await SubSubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!subSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubSubCategory not found',
      });
    }

    res.json({
      success: true,
      message: 'SubSubCategory updated successfully',
      data: subSubCategory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update sub-subcategory',
      error: error.message,
    });
  }
};

/**
 * Delete sub-subcategory
 */
exports.deleteSubSubCategory = async (req, res) => {
  try {
    const subSubCategory = await SubSubCategory.findByIdAndDelete(req.params.id);

    if (!subSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubSubCategory not found',
      });
    }

    res.json({
      success: true,
      message: 'SubSubCategory deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub-subcategory',
      error: error.message,
    });
  }
};

