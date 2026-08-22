const express = require('express');
const productController = require('../controllers/productController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateIdParam, validateProductInput } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public Catalog Endpoints
router.get('/', productController.getAllProducts);
router.get('/:id', validateIdParam, productController.getProductById);

// Admin Protected Endpoints
router.post('/', requireAuth, upload.single('image'), validateProductInput, productController.createProduct);
router.put('/:id', requireAuth, validateIdParam, upload.single('image'), validateProductInput, productController.updateProduct);
router.delete('/:id', requireAuth, validateIdParam, productController.deleteProduct);

module.exports = router;
