/**
 * Payment Routes — Razorpay webhook + payment verification
 * POST /api/payments/webhook     — Razorpay webhook
 * POST /api/payments/verify      — Client-side payment verification
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');

// POST /api/payments/webhook — Razorpay webhook handler
router.post('/webhook', asyncHandler(async (req, res) => {
  const { event, payload } = req.body;

  // Verify webhook signature (skip in mock mode)
  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('⚠️ Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  // Idempotency check
  const eventId = payload?.payment?.entity?.id || `evt_${Date.now()}`;
  try {
    await query(
      'INSERT INTO webhook_events (provider, event_id, payload) VALUES ($1, $2, $3)',
      ['razorpay', eventId, req.body]
    );
  } catch (err) {
    if (err.code === '23505') {
      // Duplicate event, already processed
      return res.json({ status: 'already_processed' });
    }
    throw err;
  }

  // Process event
  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload?.payment?.entity;
    if (paymentEntity) {
      const result = await paymentService.processPaymentSuccess(
        paymentEntity.order_id,
        paymentEntity.id,
        null // Signature verified at webhook level
      );

      // Notify
      const fullOrder = await orderService.getOrderWithItems(result.orderId);
      if (fullOrder) {
        await notificationService.notifyOrderStatusChange(fullOrder, fullOrder.items, 'placed', 'paid');
      }
    }
  }

  // Mark event as processed
  await query(
    'UPDATE webhook_events SET processed_at = now() WHERE provider = $1 AND event_id = $2',
    ['razorpay', eventId]
  );

  res.json({ status: 'ok' });
}));

// POST /api/payments/verify — Client-side verification after Razorpay checkout
router.post('/verify', asyncHandler(async (req, res) => {
  const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
  const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
  const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId) {
    throw new ApiError(400, 'Payment details required (razorpayOrderId & razorpayPaymentId)');
  }

  const result = await paymentService.processPaymentSuccess(
    razorpayOrderId, razorpayPaymentId, razorpaySignature
  );

  // Notify
  const fullOrder = await orderService.getOrderWithItems(result.orderId);
  if (fullOrder) {
    await notificationService.notifyOrderStatusChange(fullOrder, fullOrder.items, 'placed', 'paid');
  }

  res.json({ success: true, orderId: result.orderId });
}));

// POST /api/payments/confirm-upi — Direct UPI Payment Confirmation
const { customerAuth } = require('../middleware/auth');
router.post('/confirm-upi', customerAuth, asyncHandler(async (req, res) => {
  const { orderId, order_id, publicToken, public_token, utr, upiTxnId } = req.body;
  const targetRef = orderId || order_id || publicToken || public_token;
  if (!targetRef) throw new ApiError(400, 'Order identifier is required');

  const { rows: [order] } = await query(
    'SELECT * FROM orders WHERE (id::text = $1 OR public_token = $1) AND customer_id = $2',
    [String(targetRef), req.customer.id]
  );
  if (!order) throw new ApiError(404, 'Order not found');

  const txnRef = utr 
    ? `upi_${utr}_${order.order_no || Date.now()}`
    : (upiTxnId || `upi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Update payment status (or insert if not present)
  const { rowCount } = await query(
    `UPDATE payments 
     SET status = 'success', razorpay_payment_id = $1, paid_at = now()
     WHERE order_id = $2`,
    [txnRef, order.id]
  );

  if (rowCount === 0) {
    await query(
      `INSERT INTO payments (order_id, restaurant_id, method, amount_paise, status, razorpay_payment_id, paid_at)
       VALUES ($1, $2, 'upi', $3, 'success', $4, now())`,
      [order.id, order.restaurant_id, order.total_paise, txnRef]
    );
  }

  // Update order status
  await query(
    `UPDATE orders SET status = 'paid', expires_at = NULL WHERE id = $1`,
    [order.id]
  );
  await query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
     VALUES ($1, 'placed', 'paid', 'customer_upi')`,
    [order.id]
  );

  // Notify restaurant & customer
  const fullOrder = await orderService.getOrderWithItems(order.id);
  if (fullOrder) {
    try {
      await notificationService.notifyOrderStatusChange(fullOrder, fullOrder.items, 'placed', 'paid');
    } catch (e) {}
  }

  res.json({
    success: true,
    message: 'UPI Payment confirmed successfully',
    orderId: order.id,
    publicToken: order.public_token
  });
}));

module.exports = router;
