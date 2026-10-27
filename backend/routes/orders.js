/**
 * Order Routes — Customer ordering flow
 * POST /api/orders/create          — Place a new order
 * GET  /api/orders/my-orders       — Customer's order history
 * GET  /api/orders/:id             — Order detail
 * POST /api/orders/:id/cancel      — Customer cancel order
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { customerAuth } = require('../middleware/auth');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { checkDeliveryRadius } = require('../services/geoService');
const notificationService = require('../services/notificationService');

// POST /api/orders/create — Create a new order
router.post('/create', customerAuth, asyncHandler(async (req, res) => {
  const {
    restaurantId, items, orderType = 'delivery',
    deliveryName, deliveryPhone, deliveryAddress, deliveryLat, deliveryLng,
    customerNote, source = 'web', couponId, paymentMethod = 'upi'
  } = req.body;

  if (!restaurantId || !items || items.length === 0) {
    throw new ApiError(400, 'Restaurant ID and at least one item required');
  }

  // Validate delivery address & radius for delivery orders
  let deliveryDistanceM = null;
  if (orderType === 'delivery') {
    if (!deliveryAddress || !deliveryLat || !deliveryLng) {
      throw new ApiError(400, 'Delivery address with coordinates required');
    }

    const { rows: [restaurant] } = await query(
      'SELECT latitude, longitude, delivery_radius_m FROM restaurants WHERE id = $1',
      [restaurantId]
    );
    if (!restaurant) throw new ApiError(404, 'Restaurant not found');

    const { withinRadius, distanceMeters } = checkDeliveryRadius(restaurant, deliveryLat, deliveryLng);
    if (!withinRadius) {
      throw new ApiError(400, `Sorry, delivery not available at this location. You are ${(distanceMeters / 1000).toFixed(1)}km away, maximum radius is ${(restaurant.delivery_radius_m / 1000).toFixed(1)}km.`);
    }
    deliveryDistanceM = distanceMeters;
  }

  // Create order
  const order = await orderService.createOrder({
    restaurantId,
    customerId: req.customer.id,
    orderType,
    items,
    deliveryName: deliveryName || null,
    deliveryPhone: deliveryPhone || req.customer.phone,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    deliveryDistanceM,
    customerNote,
    source,
    couponId,
    paymentMethod
  });

  let paymentData = null;

  if (paymentMethod === 'cod') {
    // COD: create payment record, order stays as 'placed'
    await paymentService.processCODOrder(order.id);
  } else {
    // Online: create Razorpay payment order
    paymentData = await paymentService.createPaymentOrder(
      order.id, restaurantId, paymentMethod, order.total_paise
    );
  }

  // Get full order with restaurant details for notifications
  const fullOrder = await orderService.getOrderWithItems(order.id);

  // Notify
  await notificationService.notifyNewOrder(fullOrder, order.items);
  await notificationService.notifyOrderStatusChange(fullOrder, order.items, null, 'placed');

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      orderNo: order.order_no,
      status: order.status,
      totalPaise: order.total_paise,
      publicToken: order.public_token,
      trackingUrl: `${process.env.APP_URL}/track/${order.public_token}`
    },
    payment: paymentData
  });
}));

// POST /api/orders/mock-pay/:orderId — Mock payment (development only)
router.post('/mock-pay/:orderId', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new ApiError(403, 'Mock payment only available in development');
  }

  const { rows: [payment] } = await query(
    `SELECT * FROM payments WHERE order_id = $1 AND status = 'pending' LIMIT 1`,
    [req.params.orderId]
  );
  if (!payment) throw new ApiError(404, 'No pending payment found');

  const result = await paymentService.processPaymentSuccess(
    payment.razorpay_order_id,
    `pay_mock_${Date.now()}`,
    null
  );

  // Get full order for notifications
  const fullOrder = await orderService.getOrderWithItems(req.params.orderId);
  if (fullOrder) {
    await notificationService.notifyOrderStatusChange(fullOrder, fullOrder.items, 'placed', 'paid');
  }

  res.json({ success: true, message: 'Payment simulated', payment: result });
}));

// GET /api/orders/my-orders — Customer order history
router.get('/my-orders', customerAuth, asyncHandler(async (req, res) => {
  const { restaurantId, limit = 20, offset = 0 } = req.query;

  let sql = `SELECT o.*, r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url as restaurant_logo
             FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
             WHERE o.customer_id = $1`;
  const params = [req.customer.id];

  if (restaurantId) {
    sql += ` AND o.restaurant_id = $2`;
    params.push(restaurantId);
  }

  sql += ` ORDER BY o.placed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit), parseInt(offset));

  const { rows: orders } = await query(sql, params);

  // Get items for each order
  for (const order of orders) {
    const { rows: items } = await query(
      'SELECT item_name, variant_name, quantity, line_total_paise FROM order_items WHERE order_id = $1',
      [order.id]
    );
    order.items = items;
  }

  res.json({ success: true, orders });
}));

// GET /api/orders/:id — Order detail
router.get('/:id', customerAuth, asyncHandler(async (req, res) => {
  const order = await orderService.getOrderWithItems(req.params.id);
  if (!order || order.customer_id !== req.customer.id) {
    throw new ApiError(404, 'Order not found');
  }

  // Get status history
  const { rows: statusHistory } = await query(
    'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at',
    [req.params.id]
  );

  // Get payment info
  const { rows: [payment] } = await query(
    'SELECT method, status, amount_paise, paid_at FROM payments WHERE order_id = $1 LIMIT 1',
    [req.params.id]
  );

  res.json({
    success: true,
    order: { ...order, statusHistory, payment }
  });
}));

// POST /api/orders/:id/cancel — Customer cancel order
router.post('/:id/cancel', customerAuth, asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const { rows: [order] } = await query(
    'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
    [req.params.id, req.customer.id]
  );
  if (!order) throw new ApiError(404, 'Order not found');

  // Can only cancel if placed or paid
  if (!['placed', 'paid'].includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled at this stage');
  }

  const updatedOrder = await orderService.updateOrderStatus(
    order.id, 'cancelled', 'customer', reason,
    { cancelledBy: 'customer', cancelReason: reason }
  );

  // If payment was made, initiate refund
  if (order.status === 'paid') {
    await paymentService.initiateRefund(order.id, reason || 'Cancelled by customer');
  }

  const fullOrder = await orderService.getOrderWithItems(order.id);
  await notificationService.notifyOrderStatusChange(fullOrder, fullOrder.items, order.status, 'cancelled');

  res.json({ success: true, order: updatedOrder });
}));

module.exports = router;
