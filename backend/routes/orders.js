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
const { customerAuth, optionalCustomerAuth } = require('../middleware/auth');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { checkDeliveryRadius } = require('../services/geoService');
const notificationService = require('../services/notificationService');

// Unified Order Creation Handler — supports both / and /create, camelCase & snake_case
const handleOrderCreation = asyncHandler(async (req, res) => {
  let {
    restaurantId, restaurant_id, restaurantSlug, restaurant_slug,
    items, orderType, order_type = 'delivery',
    tableNo, table_no,
    deliveryName, delivery_name, customer_name,
    deliveryPhone, delivery_phone, customer_phone,
    deliveryAddress, delivery_address, address,
    deliveryLat, delivery_lat,
    deliveryLng, delivery_lng,
    customerNote, customer_note, special_instructions,
    scheduledDate, scheduled_date, deliveryDate, delivery_date,
    scheduledSlot, scheduled_slot, deliveryTimeSlot, delivery_time_slot,
    cakeMessage, cake_message,
    includeCutlery, include_cutlery,
    pincode,
    riderTipPaise, rider_tip_paise, tipPaise, tip_paise,
    source = 'web',
    couponId, coupon_id, coupon_code,
    paymentMethod, payment_method = 'upi'
  } = req.body;

  orderType = orderType || order_type || 'delivery';
  paymentMethod = paymentMethod || payment_method || 'upi';
  const cPhone = deliveryPhone || delivery_phone || customer_phone || req.customer?.phone;
  const cName = deliveryName || delivery_name || customer_name || req.customer?.name || 'Valued Guest';

  // 1. Resolve Restaurant ID
  if (!restaurantId && restaurant_id) restaurantId = restaurant_id;
  if (!restaurantId && (restaurantSlug || restaurant_slug)) {
    const slug = restaurantSlug || restaurant_slug;
    const { rows: [r] } = await query('SELECT id, latitude, longitude, delivery_radius_m FROM restaurants WHERE slug = $1', [slug]);
    if (!r) throw new ApiError(404, 'Restaurant not found');
    restaurantId = r.id;
  }
  if (!restaurantId) throw new ApiError(400, 'Restaurant identifier (restaurantId or restaurant_slug) required');

  // 2. Strict Customer Authentication (No anonymous orders allowed)
  const customerId = req.customer?.id;
  if (!customerId) {
    throw new ApiError(401, 'Customer authentication required. Please verify your mobile number with OTP before placing an order.');
  }

  // Update customer name if provided
  if (cName && cName !== 'Valued Guest') {
    await query(
      `UPDATE customers SET name = $1 WHERE id = $2 AND (name IS NULL OR name = '' OR name = 'Valued Guest')`,
      [cName, customerId]
    );
  }

  // 3. Resolve Items format (supports { itemId } and { item_id })
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one item is required in the order');
  }
  const cleanItems = items.map(it => ({
    itemId: it.itemId || it.item_id || it.id,
    variantId: it.variantId || it.variant_id || null,
    addons: it.addons || [],
    quantity: it.quantity || 1,
    unitPricePaise: it.unitPricePaise || it.unit_price_paise,
    note: it.note || it.special_instructions || it.specialNotes || null
  }));

  // 4. Resolve Address
  let cleanAddress = deliveryAddress || delivery_address;
  if (!cleanAddress && address) {
    if (typeof address === 'object') {
      cleanAddress = [address.address_line || address.addressLine, address.landmark, address.pincode].filter(Boolean).join(', ');
    } else {
      cleanAddress = String(address);
    }
  }

  const tNo = tableNo || table_no;
  if (orderType === 'dine_in' && !cleanAddress) {
    cleanAddress = `Dine-In • Table #${tNo || '1'}`;
  } else if (orderType === 'pickup' && !cleanAddress) {
    cleanAddress = 'Takeaway / Self-Pickup';
  }

  // 5. Delivery coordinates & distance
  const { rows: [restaurant] } = await query(
    'SELECT id, name, slug, latitude, longitude, delivery_radius_m, delivery_fee_paise, free_delivery_above_paise, min_order_paise FROM restaurants WHERE id = $1',
    [restaurantId]
  );
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  let lat = deliveryLat || delivery_lat || restaurant.latitude || 19.076090;
  let lng = deliveryLng || delivery_lng || restaurant.longitude || 72.877426;
  let deliveryDistanceM = 1000;

  if (orderType === 'delivery') {
    if (!cleanAddress) {
      throw new ApiError(400, 'Delivery street address is required for delivery orders');
    }
    if (deliveryLat && deliveryLng) {
      const { withinRadius, distanceMeters } = checkDeliveryRadius(restaurant, lat, lng);
      deliveryDistanceM = distanceMeters;
    }
  }

  // 6. Resolve Coupon Code to Coupon ID
  let resolvedCouponId = couponId || coupon_id;
  if (!resolvedCouponId && coupon_code) {
    const { rows: [cpn] } = await query(
      'SELECT id FROM coupons WHERE code = $1 AND restaurant_id = $2 AND is_active = true',
      [coupon_code, restaurantId]
    );
    if (cpn) resolvedCouponId = cpn.id;
  }

  // 7. Assemble comprehensive note (including advance slot & cake wording)
  const schDate = scheduledDate || scheduled_date || deliveryDate || delivery_date;
  const schSlot = scheduledSlot || scheduled_slot || deliveryTimeSlot || delivery_time_slot;
  const ckMsg = cakeMessage || cake_message;
  const incCutlery = includeCutlery !== undefined ? includeCutlery : include_cutlery;

  let noteParts = [];
  if (schDate || schSlot) {
    noteParts.push(`📅 Scheduled: ${schDate || 'Today'} (${schSlot || 'Standard Delivery'})`);
  }
  if (ckMsg && String(ckMsg).trim()) {
    noteParts.push(`🎂 Cake Msg: "${String(ckMsg).trim()}"`);
  }
  if (incCutlery) {
    noteParts.push(`🍴 Candles & Knife Set: Included`);
  }
  const tipAmount = riderTipPaise || rider_tip_paise || tipPaise || tip_paise;
  if (tipAmount && Number(tipAmount) > 0) {
    noteParts.push(`🚴 Rider Tip: ₹${Math.round(Number(tipAmount) / 100)}`);
  }
  const baseNote = customerNote || customer_note || special_instructions;
  if (baseNote && String(baseNote).trim()) {
    noteParts.push(String(baseNote).trim());
  }
  const finalCustomerNote = noteParts.join(' • ') || null;

  // 8. Create order via orderService
  const order = await orderService.createOrder({
    restaurantId,
    customerId,
    orderType,
    items: cleanItems,
    deliveryName: cName,
    deliveryPhone: cPhone,
    deliveryAddress: cleanAddress,
    deliveryLat: lat,
    deliveryLng: lng,
    deliveryDistanceM,
    customerNote: finalCustomerNote,
    source,
    couponId: resolvedCouponId,
    paymentMethod
  });

  let paymentData = null;
  if (paymentMethod === 'cod') {
    await paymentService.processCODOrder(order.id);
  } else {
    try {
      paymentData = await paymentService.createPaymentOrder(
        order.id, restaurantId, paymentMethod, order.total_paise
      );
    } catch (e) {
      console.warn('Payment order creation warning:', e.message);
    }
  }

  const fullOrder = await orderService.getOrderWithItems(order.id);
  try {
    await notificationService.notifyNewOrder(fullOrder, order.items);
    await notificationService.notifyOrderStatusChange(fullOrder, order.items, null, 'placed');
  } catch (e) {}

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      order_no: order.order_no,
      orderNo: order.order_no,
      status: order.status,
      total_paise: order.total_paise,
      totalPaise: order.total_paise,
      public_token: order.public_token,
      publicToken: order.public_token,
      trackingUrl: `/track/${order.public_token}`
    },
    payment: paymentData
  });
});

// Support both POST /api/orders and POST /api/orders/create with mandatory customer authentication
router.post('/', customerAuth, handleOrderCreation);
router.post('/create', customerAuth, handleOrderCreation);

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

// POST /api/orders/service-request — Dine-In Waiter / Water / Bill service request
router.post('/service-request', asyncHandler(async (req, res) => {
  const { restaurantSlug, tableNo, requestType } = req.body;
  const serviceLabels = {
    waiter: '🙋‍♂️ Calling Waiter',
    water: '💧 Requesting Water',
    bill: '🧾 Requesting Bill / QR',
    clean: '🧹 Table Cleaning'
  };
  const label = serviceLabels[requestType] || 'Service Request';

  try {
    const io = notificationService.getSocketIO?.();
    if (io) {
      io.emit('staff_service_request', {
        restaurantSlug,
        tableNo: tableNo || 'Dine-In',
        requestType,
        label,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Socket notification error:', err.message);
  }

  res.json({
    success: true,
    message: `${label} sent for Table ${tableNo || ''}! Staff notified.`
  });
}));

module.exports = router;
