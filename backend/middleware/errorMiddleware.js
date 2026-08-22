/**
 * 404 Not Found Middleware
 * Handles requests made to undefined routes
 */
function notFound(req, res, next) {
  const error = new Error(`Resource not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Global Error Handling Middleware
 * Catches all uncaught errors, standardizes response format, and hides stack trace in production
 */
function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log internal errors on server side for debugging
  if (statusCode === 500) {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

module.exports = {
  notFound,
  errorHandler
};
