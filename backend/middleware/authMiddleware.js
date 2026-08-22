/**
 * Authentication Middleware
 * Validates that the request has an active authenticated admin session
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // User is authenticated, proceed to the route controller
    return next();
  }

  // Not authenticated
  return res.status(401).json({
    success: false,
    message: 'Unauthorized access. Please log in to your admin account.'
  });
}

/**
 * Admin Role Verification Middleware (Optional Role Guard)
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden. Admin privileges required.'
  });
}

module.exports = {
  requireAuth,
  requireAdmin
};
