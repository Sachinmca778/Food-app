// tenants.js – Tenant (restaurant) creation endpoint
// Allows a restaurant owner to create a trial account (7‑day free trial)
// Returns a unique slug and a placeholder QR‑code URL.

const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid'); // use UUID for slug uniqueness

// Helper: create a URL‑safe slug from name
function generateSlug(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const uniq = nanoid(6);
  return `${base}-${uniq}`;
}

/**
 * POST /api/tenants
 * Body: { businessName, phone, city, email? }
 * Creates a new restaurant row with trial plan.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { businessName, phone, city, email } = req.body || {};
    if (!businessName || !phone || !city) {
      throw new ApiError(400, 'businessName, phone, and city are required');
    }

    const slug = generateSlug(businessName);
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Minimal required fields for restaurants table – using dummy defaults where necessary.
    const insertQuery = `
      INSERT INTO restaurants (
        slug, name, phone, address_line, city, latitude, longitude,
        delivery_radius_m, delivery_fee_paise, per_order_fee_paise,
        plan, trial_ends_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, now(), now()
      ) RETURNING slug;
    `;

    const values = [
      slug,
      businessName,
      phone,
      'Demo address', // address_line placeholder
      city,
      0.0, // latitude placeholder
      0.0, // longitude placeholder
      3000, // delivery_radius_m default
      0, // delivery_fee_paise
      0, // per_order_fee_paise
      'trial', // plan
      trialEnds.toISOString()
    ];

    const { rows } = await query(insertQuery, values);
    const createdSlug = rows[0].slug;

    // Placeholder QR code URL – you can replace with a real generator later.
    const qrUrl = `/qr/${createdSlug}.png`;

    res.json({ success: true, slug: createdSlug, qrUrl });
  })
);

module.exports = router;
