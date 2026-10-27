/**
 * Customer Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

// Authenticate customer (required)
const customerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Customer authentication required. Please login with your mobile OTP.');
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-food-app-2024');
    if (!decoded || !decoded.customerId) {
      throw new ApiError(401, 'Invalid customer session. Please login with OTP.');
    }
    req.customer = {
      id: decoded.customerId,
      phone: decoded.phone
    };
    next();
  } catch (err) {
    throw new ApiError(401, err.statusCode === 401 ? err.message : 'Invalid or expired session. Please login with OTP again.');
  }
};

// Optional customer auth (sets req.customer if token present, but doesn't block)
const optionalCustomerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret-food-app-2024');
    req.customer = {
      id: decoded.customerId,
      phone: decoded.phone
    };
  } catch (err) {
    // Invalid token? Ignore silently for optional auth
  }
  next();
};

module.exports = { customerAuth, optionalCustomerAuth };
