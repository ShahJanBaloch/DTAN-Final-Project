const { pool } = require('../config/db');

/**
 * Get all contact messages/inquiries
 * GET /api/messages (Admin Protected)
 */
async function getAllMessages(req, res, next) {
  try {
    const [messages] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit new contact inquiry
 * POST /api/messages (Public)
 */
async function createMessage(req, res, next) {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required fields.'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message, is_read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        subject.trim(),
        message.trim()
      ]
    );

    const [newMessage] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! The BalochHunar team will contact you shortly.',
      data: newMessage[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark message as read or toggle status
 * PUT /api/messages/:id/read (Admin Protected)
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

    const [existing] = await pool.query('SELECT id, is_read FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Message not found with ID ${id}`
      });
    }

    const newStatus = is_read !== undefined ? (is_read ? 1 : 0) : (existing[0].is_read ? 0 : 1);

    await pool.query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Message marked as ${newStatus ? 'read' : 'unread'}.`,
      is_read: Boolean(newStatus)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete contact message
 * DELETE /api/messages/:id (Admin Protected)
 */
async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM contact_messages WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Message not found with ID ${id}`
      });
    }

    await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMessages,
  createMessage,
  markAsRead,
  deleteMessage
};
