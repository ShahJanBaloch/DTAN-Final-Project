const express = require('express');
const artisanController = require('../controllers/artisanController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateIdParam, validateArtisanInput } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public Routes
router.get('/', artisanController.getAllArtisans);
router.get('/:id', validateIdParam, artisanController.getArtisanById);

// Admin Protected Routes
router.post('/', requireAuth, upload.single('image'), validateArtisanInput, artisanController.createArtisan);
router.put('/:id', requireAuth, validateIdParam, upload.single('image'), validateArtisanInput, artisanController.updateArtisan);
router.delete('/:id', requireAuth, validateIdParam, artisanController.deleteArtisan);

module.exports = router;
