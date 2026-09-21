const express = require('express');
const rateLimit = require('express-rate-limit');
const messageController = require('../controllers/messageController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { validateIdParam, validateMessageInput } = require('../middleware/validationMiddleware');

const router = express.Router();

// Rate limiter for public contact submissions
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many messages sent from this IP. Please try again later.'
  }
});

// Public Endpoint
router.post('/', contactLimiter, validateMessageInput, messageController.createMessage);

// Admin Protected Endpoints
router.get('/', requireAuth, requireAdmin, messageController.getAllMessages);
router.put('/:id/read', requireAuth, requireAdmin, validateIdParam, messageController.markAsRead);
router.delete('/:id', requireAuth, requireAdmin, validateIdParam, messageController.deleteMessage);

module.exports = router;
