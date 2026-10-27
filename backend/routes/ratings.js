/**
 * Rating Routes — Post-delivery feedback
 * GET  /api/ratings/:token   — Check if rating exists
 * POST /api/ratings/:token   — Submit rating
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// GET /api/ratings/:token — Check rating status
router.get('/:token', asyncHandler(async (req, res) => {
  const { rows: [order] } = await query(
    `SELECT o.id, o.order_no, o.status, o.restaurant_id,
            r.name as restaurant_name, r.logo_url as restaurant_logo
     FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.public_token = $1`,
    [req.params.token]
  );

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'delivered') {
    throw new ApiError(400, 'Order is not yet delivered');
  }

  // Check existing rating
  const { rows: [existing] } = await query(
    'SELECT * FROM order_ratings WHERE order_id = $1',
    [order.id]
  );

  const formattedRating = existing ? { ...existing, stars: existing.food_rating } : null;

  res.json({
    success: true,
    order: {
      id: order.id,
      orderNo: order.order_no,
      restaurantName: order.restaurant_name,
      restaurantLogo: order.restaurant_logo
    },
    alreadyRated: !!existing,
    rating: formattedRating
  });
}));

// POST /api/ratings/:token — Submit rating
router.post('/:token', asyncHandler(async (req, res) => {
  const foodRating = req.body.foodRating || req.body.stars || req.body.food_rating;
  const deliveryRating = req.body.deliveryRating || req.body.delivery_rating || foodRating;
  const comment = req.body.comment;

  if (!foodRating || foodRating < 1 || foodRating > 5) {
    throw new ApiError(400, 'Rating (1-5 stars) is required');
  }

  const { rows: [order] } = await query(
    `SELECT o.id, o.customer_id, o.restaurant_id, o.status
     FROM orders o WHERE o.public_token = $1`,
    [req.params.token]
  );

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'delivered') {
    throw new ApiError(400, 'Can only rate delivered orders');
  }

  // Check if already rated
  const { rows: [existing] } = await query(
    'SELECT * FROM order_ratings WHERE order_id = $1',
    [order.id]
  );
  if (existing) throw new ApiError(400, 'Order already rated');

  const { rows: [rating] } = await query(
    `INSERT INTO order_ratings (order_id, restaurant_id, customer_id, food_rating, delivery_rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [order.id, order.restaurant_id, order.customer_id, foodRating, deliveryRating || null, comment || null]
  );

  res.json({ success: true, rating: { ...rating, stars: rating.food_rating } });
}));

module.exports = router;
