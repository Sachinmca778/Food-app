/**
 * WhatsApp Service — Cloud API Integration (Meta Cloud API & Mock Mode)
 * Supports real messages via Meta WhatsApp Business Cloud API
 * When WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are provided,
 * calls https://graph.facebook.com/v21.0/{phone_number_id}/messages
 * Otherwise gracefully falls back to mock mode.
 */
const { query } = require('../db/pool');
const crypto = require('crypto');

// Clean and normalize phone number for WhatsApp E.164 (without +)
function formatWhatsAppPhone(phone) {
  if (!phone) return null;
  let clean = phone.toString().replace(/\D/g, '');
  // If 10-digit Indian phone number, prepend 91
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

// Check if real WhatsApp credentials are configured
function isLiveMode() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Send a WhatsApp message
 */
async function sendMessage(restaurantId, customerPhone, templateName, body, orderId = null) {
  const formattedPhone = formatWhatsAppPhone(customerPhone);
  if (!formattedPhone) {
    console.error('❌ [WhatsApp] Invalid customer phone:', customerPhone);
    return { error: 'Invalid phone number', status: 'failed' };
  }

  let waMessageId = null;
  let status = 'queued';
  let errorCode = null;

  if (isLiveMode()) {
    try {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: body
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages.length > 0) {
        waMessageId = data.messages[0].id;
        status = 'sent';
        console.log(`✅ [Meta WhatsApp] Message sent to ${formattedPhone}! Message ID: ${waMessageId}`);
      } else {
        errorCode = data.error?.code ? `META_${data.error.code}` : 'META_ERROR';
        status = 'failed';
        console.error(`❌ [Meta WhatsApp Error] To: ${formattedPhone}`);
        console.error(`   Message: ${data.error?.message || 'Unknown error'}`);
        console.error(`   Details:`, data.error?.error_data || data.error);
        if (data.error?.code === 190) {
          console.error(`   👉 Hint: Your WHATSAPP_ACCESS_TOKEN has expired or is invalid. Generate a permanent System User Token in Meta Business Manager.`);
        } else if (data.error?.code === 131030) {
          console.error(`   👉 Hint: In Meta Development Mode, the recipient ${formattedPhone} must be added to 'To' test phone numbers in Meta Developer Console.`);
        }
      }
    } catch (err) {
      console.error(`❌ [Meta WhatsApp Network Error]:`, err.message);
      status = 'failed';
      errorCode = 'NETWORK_ERROR';
    }
  } else {
    // Mock Mode
    waMessageId = `wamid_mock_${crypto.randomBytes(8).toString('hex')}`;
    status = 'sent';
    console.log(`📱 [MOCK WhatsApp] To: +${formattedPhone}`);
    console.log(`   Template: ${templateName}`);
    console.log(`   Order ID: ${orderId || 'N/A'}`);
    console.log(`   Body:\n${body}`);
    console.log(`   ─────────────────────────────────────────────`);
  }

  // Find customer_id from phone if possible
  let customerId = null;
  try {
    const clean10 = formattedPhone.slice(-10);
    const { rows: [customer] } = await query(
      `SELECT id FROM customers WHERE phone LIKE '%' || $1 LIMIT 1`,
      [clean10]
    );
    if (customer) customerId = customer.id;
  } catch (err) {
    // Continue even if customer lookup fails
  }

  // Log message in database
  try {
    await query(
      `INSERT INTO whatsapp_messages (restaurant_id, customer_id, order_id, direction, wa_message_id, template_name, body, status, error_code)
       VALUES ($1, $2, $3, 'outbound', $4, $5, $6, $7, $8)`,
      [restaurantId, customerId, orderId, waMessageId, templateName, body, status, errorCode]
    );
  } catch (err) {
    console.error('Error logging WA message to DB:', err.message);
  }

  return { waMessageId, status, liveMode: isLiveMode(), error: errorCode };
}

/**
 * Send order confirmation to customer
 */
async function sendOrderConfirmation(order, restaurantName) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const body = `🎉 *Order Confirmed! (#${order.order_no})*\n\n` +
    `🍽️ *${restaurantName}*\n` +
    `💰 Total: *₹${(order.total_paise / 100).toFixed(2)}*\n` +
    `📍 Type: *${order.order_type.toUpperCase()}*\n\n` +
    `The kitchen has received your order and is reviewing it now.\n\n` +
    `🔴 *Live Tracking & Updates:*\n` +
    `${appUrl}/track/${order.public_token}\n\n` +
    `Reply "status" anytime to check progress!`;

  return sendMessage(order.restaurant_id, order.delivery_phone || order.customer_phone_number, 'order_confirmed', body, order.id);
}

/**
 * Send order notification to restaurant owner / kitchen
 */
async function sendOrderToRestaurant(order, orderItems, restaurantPhone) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const itemsList = (orderItems || []).map(i => `• ${i.quantity}x ${i.item_name || i.itemName || 'Dish'}${i.variant_name || i.variantName ? ` (${i.variant_name || i.variantName})` : ''}`).join('\n');
  const body = `🔔 *NEW ORDER RECEIVED! (#${order.order_no})*\n\n` +
    `Items:\n${itemsList}\n\n` +
    `💰 Total: *₹${(order.total_paise / 100).toFixed(2)}*\n` +
    `📦 Type: *${order.order_type.toUpperCase()}*\n` +
    (order.delivery_name ? `👤 Customer: ${order.delivery_name} (${order.delivery_phone})\n` : '') +
    (order.delivery_address ? `📍 Address: ${order.delivery_address}\n` : '') +
    (order.customer_note ? `📝 Note: "${order.customer_note}"\n` : '') +
    `\n👉 Open Kitchen Dashboard to Accept:\n${appUrl}/dashboard`;

  return sendMessage(order.restaurant_id, restaurantPhone, 'new_order_alert', body, order.id);
}

/**
 * Send order accepted message to customer
 */
async function sendOrderAccepted(order, prepMinutes) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const body = `👨‍🍳 *Order #${order.order_no} is Accepted!*\n\n` +
    `The kitchen is preparing your fresh meal now.\n` +
    `⏱️ Estimated prep time: *${prepMinutes || 25} minutes*\n\n` +
    `🔴 Track live kitchen status:\n${appUrl}/track/${order.public_token}`;

  return sendMessage(order.restaurant_id, order.delivery_phone, 'order_accepted', body, order.id);
}

/**
 * Send order rejected message to customer
 */
async function sendOrderRejected(order, reason) {
  const body = `❌ *Update on Order #${order.order_no}*\n\n` +
    `We are deeply sorry, but the restaurant was unable to accept your order.\n` +
    `Reason: ${reason || 'Kitchen closed or items out of stock'}\n\n` +
    `💳 Any online payment will be refunded to your original source within 2-4 business days.`;

  return sendMessage(order.restaurant_id, order.delivery_phone, 'order_rejected', body, order.id);
}

/**
 * Send order ready message
 */
async function sendOrderReady(order) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const body = `🍽️ *Order #${order.order_no} is Ready!*\n\n` +
    (order.order_type === 'pickup'
      ? `🛍️ Your order is packed and waiting at the counter. Please come pick it up!\n\nDetails: ${appUrl}/track/${order.public_token}`
      : `🛵 Food is packed! Assigning delivery partner now.\n\nLive tracking: ${appUrl}/track/${order.public_token}`);

  return sendMessage(order.restaurant_id, order.delivery_phone, 'order_ready', body, order.id);
}

/**
 * Send out for delivery message
 */
async function sendOutForDelivery(order) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  let body = `🛵 *Order #${order.order_no} is Out for Delivery!*\n\n` +
    `Hot and fresh food is on the way to you right now!\n\n`;
  if (order.rider_name) body += `👤 Rider: *${order.rider_name}*\n`;
  if (order.rider_phone) body += `📞 Contact: *${order.rider_phone}*\n`;
  body += `\n🔴 *Track Delivery Live on Map:*\n${appUrl}/track/${order.public_token}`;

  return sendMessage(order.restaurant_id, order.delivery_phone, 'out_for_delivery', body, order.id);
}

/**
 * Send delivered message
 */
async function sendDelivered(order) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const body = `🎉 *Order #${order.order_no} Delivered!*\n\n` +
    `We hope you enjoy your meal! Thank you for ordering directly from us.\n\n` +
    `⭐ *How was your food? Rate your experience:*\n` +
    `${appUrl}/rate/${order.public_token}\n\n` +
    `Reply "1" anytime to quickly reorder your favorite items!`;

  return sendMessage(order.restaurant_id, order.delivery_phone, 'order_delivered', body, order.id);
}

/**
 * Send rating request (30 min after delivery)
 */
async function sendRatingRequest(order, restaurantName) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const body = `😋 *How was your order from ${restaurantName}?*\n\n` +
    `Your feedback helps our kitchen serve you better and earns you loyalty points!\n\n` +
    `⭐ Tap here to rate:\n${appUrl}/rate/${order.public_token}`;

  return sendMessage(order.restaurant_id, order.delivery_phone, 'rating_request', body, order.id);
}

module.exports = {
  sendMessage,
  sendOrderConfirmation,
  sendOrderToRestaurant,
  sendOrderAccepted,
  sendOrderRejected,
  sendOrderReady,
  sendOutForDelivery,
  sendDelivered,
  sendRatingRequest,
  formatWhatsAppPhone,
  isLiveMode
};
