/**
 * Loyalty Service
 * Manages loyalty points: earn on delivery, redeem on checkout
 */
const { query, transaction } = require('../db/pool');

// Default: 1 point per ₹10 spent, 100 points = ₹50 off
const POINTS_PER_100_PAISE = 1;   // 1 point per ₹1
const POINT_VALUE_PAISE = 50;      // 1 point = ₹0.50

/**
 * Award loyalty points after order delivered
 */
async function awardPoints(restaurantId, customerId, orderId, totalPaise) {
  const pointsEarned = Math.floor(totalPaise / 100 * POINTS_PER_100_PAISE);
  if (pointsEarned <= 0) return 0;

  await query(
    `INSERT INTO loyalty_ledger (restaurant_id, customer_id, order_id, points, reason)
     VALUES ($1, $2, $3, $4, 'order_earned')`,
    [restaurantId, customerId, orderId, pointsEarned]
  );

  await query(
    `UPDATE restaurant_customers SET loyalty_points = loyalty_points + $1
     WHERE restaurant_id = $2 AND customer_id = $3`,
    [pointsEarned, restaurantId, customerId]
  );

  return pointsEarned;
}

/**
 * Redeem loyalty points during checkout
 * @returns {number} Discount in paise
 */
async function redeemPoints(restaurantId, customerId, pointsToRedeem) {
  return transaction(async (client) => {
    const { rows: [rc] } = await client.query(
      `SELECT loyalty_points FROM restaurant_customers 
       WHERE restaurant_id = $1 AND customer_id = $2 FOR UPDATE`,
      [restaurantId, customerId]
    );

    if (!rc || rc.loyalty_points < pointsToRedeem) {
      return { success: false, error: 'Not enough points' };
    }

    const discountPaise = pointsToRedeem * POINT_VALUE_PAISE;

    await client.query(
      `UPDATE restaurant_customers SET loyalty_points = loyalty_points - $1
       WHERE restaurant_id = $2 AND customer_id = $3`,
      [pointsToRedeem, restaurantId, customerId]
    );

    return { success: true, discountPaise, pointsRedeemed: pointsToRedeem };
  });
}

/**
 * Get customer's loyalty balance
 */
async function getBalance(restaurantId, customerId) {
  const { rows: [rc] } = await query(
    `SELECT loyalty_points FROM restaurant_customers 
     WHERE restaurant_id = $1 AND customer_id = $2`,
    [restaurantId, customerId]
  );
  return rc?.loyalty_points || 0;
}

module.exports = {
  awardPoints,
  redeemPoints,
  getBalance,
  POINTS_PER_100_PAISE,
  POINT_VALUE_PAISE
};
