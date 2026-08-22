const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

/**
 * Admin Login Controller
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Validation: Required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Query user from database (Parameterized SQL query to prevent SQL Injection)
    const [rows] = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = rows[0];

    // 3. Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // 5. Return success (NEVER return password hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Logout Controller
 * POST /api/auth/logout
 */
function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('balochhunar.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Current Session User
 * GET /api/auth/me
 */
function getMe(req, res) {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Not authenticated'
  });
}

/**
 * Get Admin Dashboard Statistics (KPIs)
 * GET /api/auth/stats
 */
async function getDashboardStats(req, res, next) {
  try {
    // Run parallel count queries for dashboard metrics
    const [
      [productCount],
      [artisanCount],
      [categoryCount],
      [serviceCount],
      [galleryCount],
      [unreadMessages],
      [totalMessages],
      recentMessages
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM products'),
      pool.query('SELECT COUNT(*) as count FROM artisans'),
      pool.query('SELECT COUNT(*) as count FROM categories'),
      pool.query('SELECT COUNT(*) as count FROM services'),
      pool.query('SELECT COUNT(*) as count FROM gallery'),
      pool.query('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0'),
      pool.query('SELECT COUNT(*) as count FROM contact_messages'),
      pool.query('SELECT id, name, email, subject, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5')
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts: productCount[0].count,
        totalArtisans: artisanCount[0].count,
        totalCategories: categoryCount[0].count,
        totalServices: serviceCount[0].count,
        totalGallery: galleryCount[0].count,
        unreadMessages: unreadMessages[0].count,
        totalMessages: totalMessages[0].count
      },
      recentMessages: recentMessages[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  getMe,
  getDashboardStats
};
