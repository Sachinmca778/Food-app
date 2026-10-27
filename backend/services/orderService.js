/**
 * Order Service — State Machine & Business Logic
 * Manages order lifecycle: create, status transitions, validation
 */
const { query, transaction } = require('../db/pool');
const { ApiError } = require('../middleware/errorHandler');

// Valid state transitions
const VALID_TRANSITIONS = {
  placed:           ['paid', 'accepted', 'cancelled', 'expired'],  // 'accepted' for COD
  paid:             ['accepted', 'rejected', 'cancelled'],
  accepted:         ['preparing', 'cancelled'],
  preparing:        ['ready', 'cancelled'],
  ready:            ['out_for_delivery', 'delivered'],  // pickup = direct delivered
  out_for_delivery: ['delivered'],
  delivered:        [],
  cancelled:        [],
  rejected:         [],
  expired:          []
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Create a new order
 */
async function createOrder({
  restaurantId, customerId, orderType, items,
  deliveryName, deliveryPhone, deliveryAddress, deliveryLat, deliveryLng, deliveryDistanceM,
  customerNote, source, couponId, paymentMethod
}) {
  return transaction(async (client) => {
    // 1. Get restaurant
    const { rows: [restaurant] } = await client.query(
      'SELECT * FROM restaurants WHERE id = $1 AND is_active = true',
      [restaurantId]
    );
    if (!restaurant) throw new ApiError(404, 'Restaurant not found or inactive');

    // 2. Check restaurant is open
    if (!restaurant.is_open) throw new ApiError(400, 'Restaurant is currently closed');

    // 3. Allocate order number
    const { rows: [{ next_order_no: orderNo }] } = await client.query(
      'SELECT next_order_no($1)', [restaurantId]
    );

    // 4. Validate and price each item
    let subtotalPaise = 0;
    const orderItems = [];

    for (const item of items) {
      const { rows: [menuItem] } = await client.query(
        'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true',
        [item.itemId, restaurantId]
      );
      if (!menuItem) throw new ApiError(400, `Item "${item.itemId}" not available`);

      let unitPricePaise = menuItem.base_price_paise;
      let variantName = null;

      // Check variant
      if (item.variantId) {
        const { rows: [variant] } = await client.query(
          'SELECT * FROM menu_item_variants WHERE id = $1 AND item_id = $2 AND is_available = true',
          [item.variantId, item.itemId]
        );
        if (!variant) throw new ApiError(400, `Variant not available for ${menuItem.name}`);
        unitPricePaise = variant.price_paise;
        variantName = variant.name;
      }

      // Calculate addons
      let addonsTotal = 0;
      const addonsList = [];
      if (item.addons && item.addons.length > 0) {
        for (const addonId of item.addons) {
          const { rows: [addon] } = await client.query(
            'SELECT a.* FROM addons a WHERE a.id = $1 AND a.is_available = true',
            [addonId]
          );
          if (addon) {
            addonsTotal += addon.price_paise;
            addonsList.push({ name: addon.name, price_paise: addon.price_paise });
          }
        }
      }

      const lineTotalPaise = (unitPricePaise + addonsTotal) * item.quantity;
      subtotalPaise += lineTotalPaise;

      orderItems.push({
        itemId: item.itemId,
        itemName: menuItem.name,
        variantName,
        unitPricePaise: unitPricePaise + addonsTotal,
        quantity: item.quantity,
        addons: addonsList,
        lineTotalPaise,
        note: item.note || null
      });
    }

    // 5. Min order check
    if (subtotalPaise < restaurant.min_order_paise) {
      throw new ApiError(400, `Minimum order is ₹${(restaurant.min_order_paise / 100).toFixed(2)}`);
    }

    // 6. Calculate delivery fee
    let deliveryFeePaise = 0;
    if (orderType === 'delivery') {
      deliveryFeePaise = restaurant.delivery_fee_paise;
      if (restaurant.free_delivery_above_paise && subtotalPaise >= restaurant.free_delivery_above_paise) {
        deliveryFeePaise = 0;
      }
    }

    // 7. Calculate coupon discount
    let discountPaise = 0;
    if (couponId) {
      const { rows: [coupon] } = await client.query(
        `SELECT * FROM coupons WHERE id = $1 AND restaurant_id = $2 
         AND is_active = true AND valid_from <= now() 
         AND (valid_until IS NULL OR valid_until > now())`,
        [couponId, restaurantId]
      );
      if (coupon && subtotalPaise >= coupon.min_order_paise) {
        if (coupon.discount_type === 'percent') {
          discountPaise = Math.floor(subtotalPaise * coupon.discount_value / 100);
          if (coupon.max_discount_paise) {
            discountPaise = Math.min(discountPaise, coupon.max_discount_paise);
          }
        } else {
          discountPaise = coupon.discount_value;
        }
        // Update coupon usage
        await client.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
          [couponId]
        );
      }
    }

    // 8. Tax calculation
    const taxableAmount = subtotalPaise - discountPaise;
    const taxPaise = Math.round(taxableAmount * parseFloat(restaurant.gst_percent) / 100);

    // 9. Total
    const totalPaise = subtotalPaise - discountPaise + deliveryFeePaise + taxPaise;

    // 10. Determine initial status: COD goes directly to placed, online goes to placed (awaiting payment)
    const isCOD = paymentMethod === 'cod';
    const expiresAt = isCOD ? null : new Date(Date.now() + 15 * 60 * 1000); // 15 min for payment

    // 11. Create order
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (
        restaurant_id, order_no, customer_id, order_type, status,
        subtotal_paise, discount_paise, delivery_fee_paise, tax_paise, total_paise,
        coupon_id, delivery_name, delivery_phone, delivery_address,
        delivery_lat, delivery_lng, delivery_distance_m,
        customer_note, source, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        restaurantId, orderNo, customerId, orderType, 'placed',
        subtotalPaise, discountPaise, deliveryFeePaise, taxPaise, totalPaise,
        couponId, deliveryName, deliveryPhone, deliveryAddress,
        deliveryLat, deliveryLng, deliveryDistanceM,
        customerNote, source, expiresAt
      ]
    );

    // 12. Insert order items
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, variant_name, unit_price_paise, quantity, addons, line_total_paise, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.id, oi.itemId, oi.itemName, oi.variantName, oi.unitPricePaise, oi.quantity, JSON.stringify(oi.addons), oi.lineTotalPaise, oi.note]
      );
    }

    // 13. Status history
    await client.query(
      `INSERT INTO order_status_history (order_id, to_status, changed_by) VALUES ($1, 'placed', 'customer')`,
      [order.id]
    );

    // 14. Upsert restaurant_customers
    await client.query(
      `INSERT INTO restaurant_customers (restaurant_id, customer_id, source)
       VALUES ($1, $2, $3)
       ON CONFLICT (restaurant_id, customer_id) DO NOTHING`,
      [restaurantId, customerId, source]
    );

    return {
      ...order,
      items: orderItems
    };
  });
}

/**
 * Update order status (state machine enforced)
 */
async function updateOrderStatus(orderId, newStatus, changedBy, note, extraFields = {}) {
  return transaction(async (client) => {
    // Lock the row
    const { rows: [order] } = await client.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (!order) throw new ApiError(404, 'Order not found');

    if (!canTransition(order.status, newStatus)) {
      throw new ApiError(400, `Cannot change order from "${order.status}" to "${newStatus}"`);
    }

    // Build update fields
    const updates = { status: newStatus };
    const now = new Date();

    switch (newStatus) {
      case 'accepted':
        updates.accepted_at = now;
        if (extraFields.prepMinutes) {
          updates.prep_minutes = extraFields.prepMinutes;
          updates.estimated_ready_at = new Date(now.getTime() + extraFields.prepMinutes * 60000);
        }
        break;
      case 'ready':
        updates.ready_at = now;
        break;
      case 'out_for_delivery':
        if (extraFields.riderName) updates.rider_name = extraFields.riderName;
        if (extraFields.riderPhone) updates.rider_phone = extraFields.riderPhone;
        break;
      case 'delivered':
        updates.delivered_at = now;
        break;
      case 'cancelled':
        updates.cancelled_by = extraFields.cancelledBy || changedBy;
        updates.cancel_reason = extraFields.cancelReason || null;
        break;
      case 'rejected':
        updates.cancelled_by = 'restaurant';
        updates.cancel_reason = extraFields.cancelReason || 'Rejected by restaurant';
        break;
    }

    // Build dynamic UPDATE query
    const setClauses = [];
    const values = [];
    let paramIdx = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIdx}`);
      values.push(value);
      paramIdx++;
    }
    values.push(orderId);

    const { rows: [updatedOrder] } = await client.query(
      `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    // Status history
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, order.status, newStatus, changedBy, note]
    );

    // If delivered, update restaurant_customers stats
    if (newStatus === 'delivered') {
      await client.query(
        `UPDATE restaurant_customers 
         SET total_orders = total_orders + 1,
             total_spent_paise = total_spent_paise + $1,
             last_order_at = now(),
             first_order_at = COALESCE(first_order_at, now())
         WHERE restaurant_id = $2 AND customer_id = $3`,
        [updatedOrder.total_paise, updatedOrder.restaurant_id, updatedOrder.customer_id]
      );
    }

    return updatedOrder;
  });
}

/**
 * Get order with items
 */
async function getOrderWithItems(orderId) {
  const { rows: [order] } = await query(
    `SELECT o.*, r.name as restaurant_name, r.slug as restaurant_slug, r.phone as restaurant_phone,
            c.name as customer_name, c.phone as customer_phone_number
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!order) return null;

  const { rows: items } = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_name',
    [orderId]
  );

  return { ...order, items };
}

/**
 * Get order by public token (for tracking page)
 */
async function getOrderByToken(token) {
  const { rows: [order] } = await query(
    `SELECT o.*, r.name as restaurant_name, r.slug as restaurant_slug, r.phone as restaurant_phone,
            r.logo_url as restaurant_logo
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.public_token = $1`,
    [token]
  );
  if (!order) return null;

  const { rows: items } = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY item_name',
    [orderId]
  );

  const { rows: statusHistory } = await query(
    'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at',
    [order.id]
  );

  return { ...order, items, statusHistory };
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderWithItems,
  getOrderByToken,
  canTransition,
  VALID_TRANSITIONS
};
