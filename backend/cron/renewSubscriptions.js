// Recurring Billing Cron: Renew paid subscriptions
// Runs daily to extend next_billing_at for restaurants with active paid plans.
// In a real integration we'd call Stripe to charge the subscription and handle failures.
// Here we simply advance the next billing date and log the action.

const { query } = require('../db/pool');

async function renewSubscriptions() {
  try {
    const now = new Date().toISOString();
    const { rows: dueRestaurants } = await query(
      `SELECT id, slug, plan, next_billing_at FROM restaurants 
       WHERE plan = 'paid' AND next_billing_at <= $1`,
      [now]
    );
    if (dueRestaurants.length === 0) {
      console.log('✅ No subscriptions due for renewal at', now);
      return;
    }
    for (const r of dueRestaurants) {
      // For demo, extend by 30 days (monthly). Adjust if annual logic is stored.
      const intervalDays = 30; // default monthly; could be stored per restaurant.
      await query(
        `UPDATE restaurants SET next_billing_at = now() + ($1 || ' days')::interval WHERE id = $2`,
        [intervalDays, r.id]
      );
      console.log(`🔄 Renewed subscription for ${r.slug} (id ${r.id})`);
    }
  } catch (err) {
    console.error('❌ Error in renewSubscriptions cron:', err.message);
  }
}

module.exports = { renewSubscriptions };
