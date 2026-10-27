/**
 * Auth Routes — Customer OTP Login
 * POST /api/auth/send-otp  — Send OTP to phone
 * POST /api/auth/verify-otp — Verify OTP and get JWT
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// POST /api/auth/send-otp
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, 'Phone number is required');

  // Normalize phone
  const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  // Store OTP (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60000);

  await query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [normalizedPhone, otpHash, expiresAt]
  );

  // In development, log OTP to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`📲 OTP for ${normalizedPhone}: ${otp}`);
  }

  // TODO: Send OTP via SMS/WhatsApp in production

  res.json({
    success: true,
    message: 'OTP sent successfully',
    ...(process.env.NODE_ENV === 'development' && { otp }) // Only in dev
  });
}));

// POST /api/auth/verify-otp
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) throw new ApiError(400, 'Phone and OTP are required');

  const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;

  // Find latest unexpired, unconsumed OTP
  const { rows: [otpRecord] } = await query(
    `SELECT * FROM otp_codes 
     WHERE phone = $1 AND consumed_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedPhone]
  );

  if (!otpRecord) throw new ApiError(400, 'OTP expired or not found. Please request a new one.');

  // Check attempts
  if (otpRecord.attempts >= (parseInt(process.env.OTP_MAX_ATTEMPTS) || 3)) {
    throw new ApiError(429, 'Too many attempts. Please request a new OTP.');
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otp, otpRecord.code_hash);

  if (!isValid) {
    await query(
      'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
      [otpRecord.id]
    );
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  // Mark OTP as consumed
  await query(
    'UPDATE otp_codes SET consumed_at = now() WHERE id = $1',
    [otpRecord.id]
  );

  // Upsert customer
  let { rows: [customer] } = await query(
    'SELECT * FROM customers WHERE phone = $1',
    [normalizedPhone]
  );

  if (!customer) {
    const { rows: [newCustomer] } = await query(
      'INSERT INTO customers (phone, name) VALUES ($1, $2) RETURNING *',
      [normalizedPhone, name || null]
    );
    customer = newCustomer;
  } else if (name && !customer.name) {
    await query('UPDATE customers SET name = $1 WHERE id = $2', [name, customer.id]);
    customer.name = name;
  }

  // Generate JWT
  const token = jwt.sign(
    { customerId: customer.id, phone: customer.phone },
    process.env.JWT_SECRET || 'dev-jwt-secret-food-app-2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    success: true,
    token,
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name
    }
  });
}));

// GET /api/auth/me — Get current customer profile
const { customerAuth } = require('../middleware/auth');
router.get('/me', customerAuth, asyncHandler(async (req, res) => {
  const { rows: [customer] } = await query(
    'SELECT id, phone, name, created_at FROM customers WHERE id = $1',
    [req.customer.id]
  );

  const { rows: addresses } = await query(
    'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
    [req.customer.id]
  );

  res.json({ success: true, customer: { ...customer, addresses } });
}));

// POST /api/auth/address — Add/update customer address
router.post('/address', customerAuth, asyncHandler(async (req, res) => {
  const { label, addressLine, landmark, pincode, latitude, longitude, isDefault } = req.body;
  if (!addressLine) throw new ApiError(400, 'Address is required');

  // If setting as default, unset others
  if (isDefault) {
    await query(
      'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1',
      [req.customer.id]
    );
  }

  const { rows: [address] } = await query(
    `INSERT INTO customer_addresses (customer_id, label, address_line, landmark, pincode, latitude, longitude, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.customer.id, label, addressLine, landmark, pincode, latitude, longitude, isDefault || false]
  );

  res.json({ success: true, address });
}));

module.exports = router;
