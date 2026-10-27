/**
 * Error Handler Middleware
 * Catches all unhandled errors and returns consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Postgres unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      detail: err.detail
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record not found',
      detail: err.detail
    });
  }

  // Postgres check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      detail: err.detail
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async route wrapper: catches errors from async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom API Error class
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, asyncHandler, ApiError };
