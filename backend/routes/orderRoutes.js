const express = require('express');
const orderController = require('../controllers/orderController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const paymentMethods = require('../config/paymentMethods');

const router = express.Router();

// Guest checkout is protected after creation by a cryptographically random tracking token.
router.get('/payment-methods', (req, res) => {
  res.json({
    success: true,
    demoOnly: true,
    message: 'Replace demo payment details with verified BalochHunar platform accounts before accepting payments.',
    data: paymentMethods
  });
});
router.post('/', orderController.createOrder);
router.get('/track/:orderNumber', orderController.getTrackedOrder);
router.post('/track/:orderNumber/payment-proof', upload.single('payment_proof'), orderController.uploadPaymentProof);

// Admin order control plane.
router.get('/admin', requireAuth, requireAdmin, orderController.getAdminOrders);
router.get('/admin/:id', requireAuth, requireAdmin, orderController.getAdminOrder);
router.put('/admin/:id/status', requireAuth, requireAdmin, orderController.updateStatus);
router.put('/admin/:id/payment', requireAuth, requireAdmin, orderController.updatePayment);
router.put('/admin/:id/assign-artisan', requireAuth, requireAdmin, orderController.assignArtisan);
router.put('/admin/:id/shipping', requireAuth, requireAdmin, orderController.updateShipping);
router.get('/admin/:id/history', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const [history] = await pool.query(
      `SELECT h.*, u.name AS changed_by_name FROM order_status_history h
       LEFT JOIN users u ON u.id = h.changed_by_user_id WHERE h.order_id = ? ORDER BY h.created_at ASC, h.id ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
});

module.exports = router;
