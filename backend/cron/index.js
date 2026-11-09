// Cron orchestrator
const cron = require('node-cron');
const { expireUnpaidOrders } = require('./expireOrders');
const { processReminders } = require('./reminderOrders');
const { renewSubscriptions } = require('./renewSubscriptions');

function initCronJobs() {
  console.log('⏱️  Initializing scheduled cron jobs...');

  // Every 2 minutes: expire unpaid orders
  cron.schedule('*/2 * * * *', () => {
    expireUnpaidOrders();
  });

  // Every 5 minutes: send rating requests and reminders
  cron.schedule('*/5 * * * *', () => {
    processReminders();
  });

  // Daily at 02:00 AM: renew paid subscriptions
  cron.schedule('0 2 * * *', () => {
    renewSubscriptions();
  });
}

module.exports = { initCronJobs };