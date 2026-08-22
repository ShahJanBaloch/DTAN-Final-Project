const express = require('express');
const serviceController = require('../controllers/serviceController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateIdParam, validateServiceInput } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public Routes
router.get('/', serviceController.getAllServices);
router.get('/:id', validateIdParam, serviceController.getServiceById);

// Admin Protected Routes
router.post('/', requireAuth, validateServiceInput, serviceController.createService);
router.put('/:id', requireAuth, validateIdParam, validateServiceInput, serviceController.updateService);
router.delete('/:id', requireAuth, validateIdParam, serviceController.deleteService);

module.exports = router;
