/**
 * Staff Authentication Middleware
 * Verifies staff JWT token, checks role permissions
 */
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { ApiError } = require('./errorHandler');

// Authenticate staff (restaurant owner/manager/staff)
const staffAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Staff authentication required.');
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.STAFF_JWT_SECRET || 'dev-staff-secret-food-app-2024');
    req.staff = {
      id: decoded.staffId,
      restaurantId: decoded.restaurantId,
      role: decoded.role,
      isSuperAdmin: decoded.isSuperAdmin || false
    };
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired staff token.');
  }
};

// Super admin only
const superAdminAuth = (req, res, next) => {
  staffAuth(req, res, () => {
    if (!req.staff.isSuperAdmin) {
      throw new ApiError(403, 'Super admin access required.');
    }
    next();
  });
};

// Owner or manager only
const ownerAuth = (req, res, next) => {
  staffAuth(req, res, () => {
    if (req.staff.isSuperAdmin) return next(); // super admin can do anything
    if (!['owner', 'manager'].includes(req.staff.role)) {
      throw new ApiError(403, 'Owner or manager access required.');
    }
    next();
  });
};

module.exports = { staffAuth, superAdminAuth, ownerAuth };
