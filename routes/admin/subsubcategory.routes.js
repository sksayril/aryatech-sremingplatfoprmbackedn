const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const subSubCategoryController = require('../../controllers/admin/subsubcategory.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create sub-subcategory
router.post('/', subSubCategoryController.createSubSubCategory);

// Get all sub-subcategories
router.get('/', subSubCategoryController.getAllSubSubCategories);

// Get sub-subcategory by ID
router.get('/:id', subSubCategoryController.getSubSubCategoryById);

// Update sub-subcategory
router.put('/:id', subSubCategoryController.updateSubSubCategory);

// Delete sub-subcategory
router.delete('/:id', subSubCategoryController.deleteSubSubCategory);

module.exports = router;

