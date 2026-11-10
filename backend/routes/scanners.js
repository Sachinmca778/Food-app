// Scanner upload and payment routes
const express = require('express');
const router = express.Router();
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { query } = require('../db/pool');
const { stripe } = require('../services/stripeService'); // We'll create a simple wrapper

// GET /api/scanners/:slug – list scanners for a restaurant
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { rows: restaurant } = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
  if (!restaurant[0]) throw new ApiError(404, 'Restaurant not found');
  const { rows: scanners } = await query('SELECT id, image_url, price_cents, paid FROM scanners WHERE restaurant_id = $1', [restaurant[0].id]);
  res.json({ success: true, scanners });
}));

router.post('/upload', asyncHandler(async (req, res) => {
  const { slug, imageUrl, priceCents } = req.body;
  if (!slug || !imageUrl || !priceCents) throw new ApiError(400, 'slug, imageUrl and priceCents are required');

  // Find restaurant
  const { rows: [restaurant] } = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  // Insert scanner record
  const { rows: [scanner] } = await query(
    `INSERT INTO scanners (restaurant_id, image_url, price_cents, paid)
     VALUES ($1, $2, $3, false)
     RETURNING id, image_url, price_cents`,
    [restaurant.id, imageUrl, priceCents]
  );

  res.json({ success: true, scanner });
}));

// POST /api/scanners/create-payment – start Stripe Checkout for a specific scanner
router.post('/create-payment', asyncHandler(async (req, res) => {
  const { scannerId, successRedirect, cancelRedirect } = req.body;
  if (!scannerId) throw new ApiError(400, 'scannerId is required');

  // Load scanner
  const { rows: [scanner] } = await query(
    `SELECT s.id, s.price_cents, r.slug FROM scanners s
     JOIN restaurants r ON s.restaurant_id = r.id
     WHERE s.id = $1`,
    [scannerId]
  );
  if (!scanner) throw new ApiError(404, 'Scanner not found');

  const stripeInstance = stripe(); // lazy load Stripe with secret from env
  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{ price_data: { currency: 'usd', product_data: { name: `Scanner for ${scanner.slug}` }, unit_amount: scanner.price_cents }, quantity: 1 }],
    metadata: { scanner_id: scanner.id },
    success_url: `${process.env.FRONTEND_URL || 'https://directdine.com'}${successRedirect || '/owner'}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'https://directdine.com'}${cancelRedirect || '/owner'}?canceled=1`
  });

  res.json({ success: true, checkoutUrl: session.url });
}));

// POST /api/scanners/checkout-success – mark scanner as paid after Stripe redirects back
router.post('/checkout-success', asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw new ApiError(400, 'sessionId is required');

  const stripeInstance = stripe();
  const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
  if (!session) throw new ApiError(404, 'Checkout session not found');
  if (session.payment_status !== 'paid') return res.json({ success: false, error: 'Payment not completed' });

  const scannerId = session.metadata?.scanner_id;
  if (!scannerId) throw new ApiError(400, 'Missing scanner_id in session metadata');

  await query('UPDATE scanners SET paid = true WHERE id = $1', [scannerId]);
  res.json({ success: true });
}));

module.exports = router;
