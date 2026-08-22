const express = require('express');
const galleryController = require('../controllers/galleryController');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public Route
router.get('/', galleryController.getAllGallery);

// Admin Protected Routes
router.post('/', requireAuth, upload.single('image'), galleryController.createGalleryItem);
router.delete('/:id', requireAuth, galleryController.deleteGalleryItem);

module.exports = router;
