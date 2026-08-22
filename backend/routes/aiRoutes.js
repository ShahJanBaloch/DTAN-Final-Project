const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiter for AI operations (30 requests per 15 minutes per admin IP)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'AI request limit reached. Please wait a few moments before generating again.'
  }
});

// All AI routes require Admin Authentication & Rate Limiting
router.use(requireAuth, aiLimiter);

router.post('/product-description', aiController.generateProductDescription);
router.post('/suggest-tags', aiController.suggestTagsAndCategory);
router.post('/artisan-story', aiController.generateArtisanStory);

module.exports = router;
