const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { imageUpload } = require('../../middleware/upload.middleware');
const categoryController = require('../../controllers/admin/category.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create category
router.post('/', imageUpload.single('image'), categoryController.createCategory);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Update category
router.put('/:id', imageUpload.single('image'), categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;

