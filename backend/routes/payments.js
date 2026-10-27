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

module.exports = router;
