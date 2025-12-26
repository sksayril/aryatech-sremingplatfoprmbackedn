const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const subCategoryController = require('../../controllers/admin/subcategory.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create subcategory
router.post('/', subCategoryController.createSubCategory);

// Get all subcategories
router.get('/', subCategoryController.getAllSubCategories);

// Get subcategory by ID
router.get('/:id', subCategoryController.getSubCategoryById);

// Update subcategory
router.put('/:id', subCategoryController.updateSubCategory);

// Delete subcategory
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;

