const crypto = require('crypto');
const { pool } = require('../config/db');

const ORDER_STATUSES = [
  'Pending', 'Awaiting Payment', 'Payment Verification Pending', 'Payment Confirmed',
  'Order Confirmed', 'Assigned to Artisan', 'Artisan Preparing', 'Ready for Dispatch',
  'Shipped', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Refunded', 'Payment Rejected'
];
const PAYMENT_STATUSES = ['Pending', 'Verification Pending', 'Verified', 'Rejected', 'Failed', 'Refunded'];
const PAYMENT_METHODS = ['Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cash on Delivery', 'Other'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function makeOrderNumber() {
  return `BH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function normalizeText(value, maxLength = 5000) {
  return String(value || '').trim().slice(0, maxLength);
}

function requiredText(value, field, maxLength = 5000) {
  const text = normalizeText(value, maxLength);
  if (!text) {
    const error = new Error(`${field} is required`);
    error.statusCode = 400;
    throw error;
  }
  return text;
}

function validateEmail(email) {
  const value = requiredText(email, 'Email address', 150).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(value)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function validateMethod(method) {
  if (!PAYMENT_METHODS.includes(method)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 400;
    throw error;
  }
  return method;
}

function addHistory(connection, orderId, previousStatus, newStatus, user, notes = null) {
  return connection.query(
    `INSERT INTO order_status_history
      (order_id, previous_status, new_status, changed_by_user_id, changed_by_role, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, previousStatus, newStatus, user?.id || null, user?.role || 'system', notes]
  );
}

async function createOrder(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const body = req.body || {};
    const productId = Number(body.product_id);
    const quantity = Number(body.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ success: false, message: 'A valid product and quantity from 1 to 99 are required.' });
    }

    const paymentMethod = validateMethod(body.payment_method);
    const customerEmail = validateEmail(body.customer_email);
    const customerName = requiredText(body.customer_name, 'Full name', 120);
    const customerPhone = requiredText(body.customer_phone, 'Mobile / WhatsApp number', 30);
    const fullAddress = requiredText(body.full_address, 'Full address');
    const area = requiredText(body.area, 'House / street / area', 150);
    const city = requiredText(body.city, 'City / district', 100);
    const province = requiredText(body.province, 'Province', 100);
    const country = normalizeText(body.country, 80) || 'Pakistan';
    const deliveryCharges = Number(process.env.DELIVERY_CHARGE || 300);
    if (!Number.isFinite(deliveryCharges) || deliveryCharges < 0) {
      return res.status(500).json({ success: false, message: 'Delivery charges are not configured correctly.' });
    }

    await connection.beginTransaction();
    const [products] = await connection.query(
      `SELECT id, name, image, price FROM products WHERE id = ? FOR SHARE`,
      [productId]
    );
    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];
    const subtotal = Number(product.price) * quantity;
    const totalAmount = subtotal + deliveryCharges;
    const trackingToken = crypto.randomBytes(32).toString('hex');
    const orderNumber = makeOrderNumber();
    const paymentStatus = paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Pending';
    const orderStatus = 'Awaiting Payment';

    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (order_number, tracking_token_hash, customer_id, customer_name, customer_email, customer_phone,
        alternative_phone, full_address, area, village_town, city, district, province, postal_code, country,
        subtotal, delivery_charges, discount_amount, total_amount, payment_method, payment_status, order_status,
        customer_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)` ,
      [
        orderNumber, hashToken(trackingToken), req.session?.user?.id || null, customerName, customerEmail,
        customerPhone, normalizeText(body.alternative_phone, 30) || null, fullAddress, area,
        normalizeText(body.village_town, 150) || null, city, normalizeText(body.district, 100) || null,
        province, normalizeText(body.postal_code, 20) || null, country, subtotal, deliveryCharges,
        totalAmount, paymentMethod, paymentStatus, orderStatus, normalizeText(body.customer_notes) || null
      ]
    );

    await connection.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image, product_price, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderResult.insertId, product.id, product.name, product.image, product.price, quantity, subtotal]
    );
    await connection.query(
      `INSERT INTO payments (order_id, payment_method, amount, currency, payment_status)
       VALUES (?, ?, ?, 'PKR', ?)`,
      [orderResult.insertId, paymentMethod, totalAmount, paymentStatus]
    );
    await addHistory(connection, orderResult.insertId, null, orderStatus, null, 'Order placed by customer');
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully. Payment remains pending until BalochHunar verifies it.',
      data: {
        orderNumber,
        trackingToken,
        productName: product.name,
        quantity,
        subtotal,
        deliveryCharges,
        totalAmount,
        paymentMethod,
        paymentStatus,
        orderStatus
      }
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    next(error);
  } finally {
    connection.release();
  }
}

async function getTrackedOrder(req, res, next) {
  try {
    const { orderNumber } = req.params;
    const token = normalizeText(req.query.token, 128);
    if (!token) return res.status(401).json({ success: false, message: 'Tracking token is required.' });
    const [orders] = await pool.query(
      `SELECT id, order_number, customer_name, customer_email, subtotal, delivery_charges, total_amount,
              currency, payment_method, payment_status, order_status, courier_name, tracking_number,
              estimated_delivery_date, created_at, updated_at
       FROM orders WHERE order_number = ? AND tracking_token_hash = ?`,
      [orderNumber, hashToken(token)]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found or tracking token is invalid.' });
    const order = orders[0];
    const [items] = await pool.query(
      `SELECT product_id, product_name, product_image, product_price, quantity, subtotal
       FROM order_items WHERE order_id = ? ORDER BY id`, [order.id]
    );
    const [history] = await pool.query(
      `SELECT new_status, notes, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC, id ASC`, [order.id]
    );
    return res.json({ success: true, data: { ...order, items, history } });
  } catch (error) {
    next(error);
  }
}

async function getAdminOrders(req, res, next) {
  try {
    const { search, status, payment_status: paymentStatus } = req.query;
    let sql = `SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.total_amount, o.currency,
      o.payment_method, o.payment_status, o.order_status, o.created_at, o.courier_name, o.tracking_number,
      a.name AS artisan_name FROM orders o LEFT JOIN artisans a ON a.id = o.assigned_artist_id WHERE 1=1`;
    const params = [];
    if (search && search.trim()) {
      sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (status && ORDER_STATUSES.includes(status)) { sql += ' AND o.order_status = ?'; params.push(status); }
    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) { sql += ' AND o.payment_status = ?'; params.push(paymentStatus); }
    sql += ' ORDER BY o.created_at DESC';
    const [orders] = await pool.query(sql, params);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) { next(error); }
}

async function getAdminOrder(req, res, next) {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, a.name AS artisan_name, u.name AS assigned_by_name
       FROM orders o LEFT JOIN artisans a ON a.id = o.assigned_artist_id
       LEFT JOIN users u ON u.id = o.assigned_by_admin_id WHERE o.id = ?`, [req.params.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [req.params.id]);
    const [payments] = await pool.query(
      `SELECT p.*, u.name AS verified_by_name FROM payments p LEFT JOIN users u ON u.id = p.verified_by_admin_id
       WHERE p.order_id = ? ORDER BY p.id DESC`, [req.params.id]
    );
    const [history] = await pool.query(
      `SELECT h.*, u.name AS changed_by_name FROM order_status_history h LEFT JOIN users u ON u.id = h.changed_by_user_id
       WHERE h.order_id = ? ORDER BY h.created_at ASC, h.id ASC`, [req.params.id]
    );
    res.json({ success: true, data: { ...orders[0], items, payments, history } });
  } catch (error) { next(error); }
}

async function updateStatus(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { status, notes } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid order status.' });
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT order_status FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Order not found.' }); }
    const timestampFields = {
      Delivered: 'delivered_at', Completed: 'completed_at', Shipped: 'shipped_at', Cancelled: 'cancelled_at'
    };
    const field = timestampFields[status];
    const sql = field ? `UPDATE orders SET order_status = ?, ${field} = NOW() WHERE id = ?` : 'UPDATE orders SET order_status = ? WHERE id = ?';
    await connection.query(sql, [status, req.params.id]);
    await addHistory(connection, req.params.id, rows[0].order_status, status, req.session.user, normalizeText(notes) || null);
    await connection.commit();
    res.json({ success: true, message: 'Order status updated.' });
  } catch (error) { await connection.rollback().catch(() => {}); next(error); }
  finally { connection.release(); }
}

async function updatePayment(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { payment_status: paymentStatus, verification_notes: notes } = req.body || {};
    if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT order_status FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!orders.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Order not found.' }); }
    await connection.query(
      `UPDATE payments SET payment_status = ?, verified_by_admin_id = ?, verification_notes = ?,
       verified_at = NOW(), paid_at = CASE WHEN ? = 'Verified' THEN NOW() ELSE paid_at END
       WHERE order_id = ?`, [paymentStatus, req.session.user.id, normalizeText(notes) || null, paymentStatus, req.params.id]
    );
    const nextOrderStatus = paymentStatus === 'Verified' ? 'Payment Confirmed' : paymentStatus === 'Rejected' ? 'Payment Rejected' : paymentStatus === 'Refunded' ? 'Refunded' : orders[0].order_status;
    await connection.query('UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?', [paymentStatus, nextOrderStatus, req.params.id]);
    if (nextOrderStatus !== orders[0].order_status) await addHistory(connection, req.params.id, orders[0].order_status, nextOrderStatus, req.session.user, normalizeText(notes) || null);
    await connection.commit();
    res.json({ success: true, message: 'Payment status updated.' });
  } catch (error) { await connection.rollback().catch(() => {}); next(error); }
  finally { connection.release(); }
}

async function assignArtisan(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const artistId = Number(req.body?.artist_id);
    if (!Number.isInteger(artistId) || artistId < 1) return res.status(400).json({ success: false, message: 'A valid artisan is required.' });
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT order_status FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    const [artists] = await connection.query('SELECT id FROM artisans WHERE id = ?', [artistId]);
    if (!orders.length || !artists.length) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Order or artisan not found.' }); }
    await connection.query(
      `INSERT INTO order_artisan_assignments (order_id, artist_id, assigned_by, assignment_notes, expected_completion_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, artistId, req.session.user.id, normalizeText(req.body.assignment_notes) || null, req.body.expected_completion_date || null]
    );
    await connection.query(
      `UPDATE orders SET assigned_artist_id = ?, assigned_by_admin_id = ?, assigned_at = NOW(), order_status = 'Assigned to Artisan' WHERE id = ?`,
      [artistId, req.session.user.id, req.params.id]
    );
    await addHistory(connection, req.params.id, orders[0].order_status, 'Assigned to Artisan', req.session.user, 'Artisan assigned by BalochHunar admin');
    await connection.commit();
    res.json({ success: true, message: 'Artisan assigned to order.' });
  } catch (error) { await connection.rollback().catch(() => {}); next(error); }
  finally { connection.release(); }
}

async function updateShipping(req, res, next) {
  try {
    const [orders] = await pool.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });
    await pool.query(
      `UPDATE orders SET courier_name = ?, tracking_number = ?, estimated_delivery_date = ? WHERE id = ?`,
      [normalizeText(req.body?.courier_name, 120) || null, normalizeText(req.body?.tracking_number, 120) || null, req.body?.estimated_delivery_date || null, req.params.id]
    );
    res.json({ success: true, message: 'Shipping details updated.' });
  } catch (error) { next(error); }
}

async function uploadPaymentProof(req, res, next) {
  try {
    const token = normalizeText(req.body?.tracking_token, 128);
    if (!token || !req.file) return res.status(400).json({ success: false, message: 'Tracking token and payment proof are required.' });
    const [orders] = await pool.query('SELECT id, order_status FROM orders WHERE order_number = ? AND tracking_token_hash = ?', [req.params.orderNumber, hashToken(token)]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found or tracking token is invalid.' });
    await pool.query(
      `UPDATE payments SET transaction_reference = ?, payment_proof = ?, payment_status = 'Verification Pending' WHERE order_id = ?`,
      [normalizeText(req.body.transaction_reference, 150) || null, `/uploads/${req.file.filename}`, orders[0].id]
    );
    await pool.query(`UPDATE orders SET payment_status = 'Verification Pending', order_status = 'Payment Verification Pending' WHERE id = ?`, [orders[0].id]);
    await pool.query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_role, notes)
       VALUES (?, ?, 'Payment Verification Pending', 'customer', 'Payment proof submitted')`, [orders[0].id, orders[0].order_status]
    );
    res.json({ success: true, message: 'Payment proof submitted for admin verification.' });
  } catch (error) { next(error); }
}

module.exports = {
  createOrder, getTrackedOrder, uploadPaymentProof, getAdminOrders, getAdminOrder,
  updateStatus, updatePayment, assignArtisan, updateShipping, ORDER_STATUSES, PAYMENT_STATUSES
};
