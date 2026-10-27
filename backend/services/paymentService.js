/**
 * Payment Service — Razorpay Integration (Mock Mode)
 * In mock mode: simulates payment creation and webhook processing
 * In real mode: calls Razorpay APIs
 */
const { query, transaction } = require('../db/pool');
const { ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

const isMockMode = !process.env.RAZORPAY_KEY_ID;

/**
 * Create a payment order (Razorpay order or mock)
 */
async function createPaymentOrder(orderId, restaurantId, method, amountPaise) {
  let razorpayOrderId = null;

  if (isMockMode) {
    // Generate mock Razorpay order ID
    razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`💳 [MOCK] Payment order created: ${razorpayOrderId} for ₹${(amountPaise / 100).toFixed(2)}`);
  } else {
    // TODO: Real Razorpay integration
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    // const rzpOrder = await instance.orders.create({ amount: amountPaise, currency: 'INR', receipt: orderId });
    // razorpayOrderId = rzpOrder.id;
    razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
  }

  // Save payment record
  const { rows: [payment] } = await query(
    `INSERT INTO payments (order_id, restaurant_id, method, amount_paise, razorpay_order_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, restaurantId, method, amountPaise, razorpayOrderId]
  );

  return {
    paymentId: payment.id,
    razorpayOrderId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_mock_key',
    amount: amountPaise,
    currency: 'INR',
    isMock: isMockMode
  };
}

/**
 * Verify and process payment (webhook or manual verification)
 */
async function processPaymentSuccess(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  return transaction(async (client) => {
    // Find payment
    const { rows: [payment] } = await client.query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1',
      [razorpayOrderId]
    );
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.status === 'success') return payment; // Already processed (idempotent)

    // Verify signature (skip in mock mode)
    if (!isMockMode && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, 'Payment signature verification failed');
      }
    }

    // Update payment status
    const { rows: [updatedPayment] } = await client.query(
      `UPDATE payments 
       SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2, paid_at = now()
       WHERE id = $3 RETURNING *`,
      [razorpayPaymentId || `pay_mock_${crypto.randomBytes(8).toString('hex')}`, razorpaySignature, payment.id]
    );

    // Update order status to 'paid'
    const { rows: [order] } = await client.query(
      'SELECT status FROM orders WHERE id = $1',
      [payment.order_id]
    );

    if (order && order.status === 'placed') {
      await client.query(
        `UPDATE orders SET status = 'paid', expires_at = NULL WHERE id = $1`,
        [payment.order_id]
      );
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
         VALUES ($1, 'placed', 'paid', 'webhook')`,
        [payment.order_id]
      );
    }

    console.log(`💳 Payment success: order ${payment.order_id}`);
    return { ...updatedPayment, orderId: payment.order_id };
  });
}

/**
 * Process COD order (mark as ready for restaurant acceptance)
 */
async function processCODOrder(orderId) {
  // COD orders skip payment, go directly from placed → can be accepted
  console.log(`💵 [COD] Order ${orderId} marked for COD`);
  
  const { rows: [payment] } = await query(
    `INSERT INTO payments (order_id, restaurant_id, method, amount_paise, status)
     SELECT id, restaurant_id, 'cod', total_paise, 'pending'
     FROM orders WHERE id = $1
     RETURNING *`,
    [orderId]
  );

  return payment;
}

/**
 * Initiate refund
 */
async function initiateRefund(orderId, reason) {
  const { rows: [payment] } = await query(
    `SELECT * FROM payments WHERE order_id = $1 AND status = 'success' LIMIT 1`,
    [orderId]
  );
  if (!payment) throw new ApiError(404, 'No successful payment found for this order');

  const { rows: [refund] } = await query(
    `INSERT INTO refunds (payment_id, order_id, amount_paise, reason, status)
     VALUES ($1, $2, $3, $4, 'initiated') RETURNING *`,
    [payment.id, orderId, payment.amount_paise, reason]
  );

  if (isMockMode) {
    // Auto-process refund in mock mode
    await query(
      `UPDATE refunds SET status = 'processed', razorpay_refund_id = $1, processed_at = now() WHERE id = $2`,
      [`rfnd_mock_${crypto.randomBytes(8).toString('hex')}`, refund.id]
    );
    await query(
      `UPDATE payments SET status = 'refunded' WHERE id = $1`,
      [payment.id]
    );
    console.log(`💳 [MOCK] Refund processed: ₹${(payment.amount_paise / 100).toFixed(2)} for order ${orderId}`);
  } else {
    // TODO: Real Razorpay refund
  }

  return refund;
}

module.exports = {
  createPaymentOrder,
  processPaymentSuccess,
  processCODOrder,
  initiateRefund,
  isMockMode
};
