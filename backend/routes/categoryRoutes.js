const express = require('express');
const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateIdParam, validateCategoryInput } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public Routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validateIdParam, categoryController.getCategoryById);

// Admin Protected Routes
router.post('/', requireAuth, validateCategoryInput, categoryController.createCategory);
router.put('/:id', requireAuth, validateIdParam, validateCategoryInput, categoryController.updateCategory);
router.delete('/:id', requireAuth, validateIdParam, categoryController.deleteCategory);

module.exports = router;
