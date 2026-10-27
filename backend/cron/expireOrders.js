/**
 * Cron Job: Expire Unpaid Orders
 * Runs every 2 minutes
 * Expires orders in 'placed' status (online payment) that are older than 15 minutes
 */
const { query } = require('../db/pool');
const { transitionStatus } = require('../services/orderService');

async function expireUnpaidOrders() {
  try {
    const timeoutMinutes = 15;
    const cutoffDate = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

    const { rows: expiredOrders } = await query(
      `SELECT o.id, o.order_no, o.restaurant_id 
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.status = 'placed' 
         AND (p.method != 'cod' OR p.method IS NULL)
         AND (p.status != 'success' OR p.status IS NULL)
         AND o.placed_at < $1
       LIMIT 50`,
      [cutoffDate]
    );


    for (const order of expiredOrders) {
      console.log(`⏰ Expiring unpaid order #${order.order_no} (${order.id})`);
      try {
        await transitionStatus(order.id, 'expired', null, 'Payment window expired (15m)');
      } catch (err) {
        console.error(`Error expiring order ${order.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Expire orders cron error:', err.message);
  }
}

module.exports = { expireUnpaidOrders };
