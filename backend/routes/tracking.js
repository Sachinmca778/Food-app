/**
 * Tracking Routes — Public order tracking
 * GET /api/track/:token — Get order status by public token (no auth)
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// GET /api/track/:token
router.get('/:token', asyncHandler(async (req, res) => {
  const { rows: [order] } = await query(
    `SELECT o.id, o.order_no, o.status, o.order_type, o.subtotal_paise, o.delivery_fee_paise,
            o.tax_paise, o.discount_paise, o.total_paise, o.delivery_phone, o.customer_note,
            o.prep_minutes, o.estimated_ready_at, o.rider_name, o.rider_phone,
            o.delivery_address, o.placed_at, o.accepted_at, o.ready_at, o.delivered_at,
            o.cancel_reason, o.public_token,
            r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url as restaurant_logo,
            r.phone as restaurant_phone, r.address_line as restaurant_address, r.upi_id as restaurant_upi_id
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.public_token = $1`,
    [req.params.token]
  );

  if (!order) throw new ApiError(404, 'Order not found');

  // Get items
  const { rows: items } = await query(
    'SELECT id, item_name, variant_name, quantity, unit_price_paise, line_total_paise, addons, note FROM order_items WHERE order_id = $1',
    [order.id]
  );

  // Get status timeline
  const { rows: timeline } = await query(
    `SELECT to_status, created_at FROM order_status_history 
     WHERE order_id = $1 ORDER BY created_at`,
    [order.id]
  );

  // Get payment info
  const { rows: [payment] } = await query(
    'SELECT method, status, amount_paise FROM payments WHERE order_id = $1 LIMIT 1',
    [order.id]
  );

  res.json({
    success: true,
    order: { ...order, items, timeline, payment }
  });
}));

module.exports = router;
