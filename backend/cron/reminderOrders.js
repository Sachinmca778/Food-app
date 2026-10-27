/**
 * Cron Job: Order Reminders & Rating Requests
 * Runs every 5 minutes
 */
const { query } = require('../db/pool');
const { sendRatingRequest } = require('../services/whatsappService');

async function processReminders() {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();

    const { rows: deliveredOrders } = await query(
      `SELECT o.id, o.order_no, o.public_token, o.restaurant_id, o.delivery_phone, r.name as restaurant_name
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       LEFT JOIN order_ratings rt ON rt.order_id = o.id
       WHERE o.status = 'delivered'
         AND rt.order_id IS NULL
         AND o.delivered_at IS NOT NULL
         AND o.delivered_at < $1
         AND o.delivered_at > $2
       LIMIT 20`,
      [thirtyMinAgo, twoHoursAgo]
    );


    for (const order of deliveredOrders) {
      try {
        await sendRatingRequest(order, order.restaurant_name);
      } catch (e) {}
    }
  } catch (err) {
    console.error('❌ Reminders cron error:', err.message);
  }
}

module.exports = { processReminders };
