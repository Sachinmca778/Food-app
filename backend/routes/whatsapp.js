/**
 * WhatsApp Webhook Routes & Interactive Bot
 * Handles Meta Cloud API Webhook verification, message reception,
 * status updates (delivered/read), automated interactive replies (Hi, Menu, Reorder, Order Status, Item Search),
 * and live testing utilities.
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { sendMessage, isLiveMode, formatWhatsAppPhone } = require('../services/whatsappService');

/**
 * Webhook Verification (Meta standard)
 * GET /api/whatsapp/webhook
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'food-app-wa-verify-token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp Webhook verified successfully with Meta!');
      return res.status(200).send(challenge);
    }
    console.warn('⚠️ Webhook token mismatch. Expected:', verifyToken, 'Received:', token);
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
});

/**
 * Core Bot Response Logic
 */
async function handleIncomingMessage(fromPhone, text, restaurantPhone = null) {
  const cleanPhone = fromPhone.replace(/\D/g, '').slice(-10);
  const normalizedText = (text || '').trim().toLowerCase();

  // Find restaurant associated with restaurant phone or default active restaurant
  let restaurant = null;
  if (restaurantPhone) {
    const cleanRestPhone = restaurantPhone.replace(/\D/g, '').slice(-10);
    const { rows: restRows } = await query(
      `SELECT * FROM restaurants WHERE phone LIKE '%' || $1 LIMIT 1`,
      [cleanRestPhone]
    );
    if (restRows.length > 0) restaurant = restRows[0];
  }

  if (!restaurant) {
    const { rows: defaultRest } = await query(
      `SELECT * FROM restaurants WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
    );
    restaurant = defaultRest[0];
  }

  if (!restaurant) {
    return { reply: "Sorry, no restaurant is currently online." };
  }

  // Check if customer exists and has past orders
  const { rows: custRows } = await query(
    `SELECT c.*, 
       (SELECT json_agg(o.*) FROM (
          SELECT id, order_no, total_paise, status, public_token, placed_at as created_at, order_type
          FROM orders 
          WHERE customer_id = c.id AND restaurant_id = $1 
          ORDER BY placed_at DESC LIMIT 3
       ) o) as recent_orders
     FROM customers c
     WHERE c.phone = $2`,
    [restaurant.id, cleanPhone]
  );

  const customer = custRows[0];
  const recentOrders = customer?.recent_orders || [];
  const latestOrder = recentOrders[0];

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const menuLink = `${appUrl}/${restaurant.slug}`;

  // Log incoming message
  try {
    await query(
      `INSERT INTO whatsapp_messages (restaurant_id, customer_id, direction, body, status)
       VALUES ($1, $2, 'inbound', $3, 'delivered')`,
      [restaurant.id, customer?.id || null, text]
    );
  } catch (err) {
    console.error('Error logging inbound WA:', err.message);
  }

  let replyText = '';

  // 1. Status Check Command (status / 3 / track)
  if (normalizedText.includes('status') || normalizedText === '3' || normalizedText.includes('track')) {
    if (latestOrder) {
      const statusEmoji = {
        placed: '⏳',
        paid: '💳',
        accepted: '👨‍🍳',
        preparing: '🍳',
        ready: '🍽️',
        out_for_delivery: '🛵',
        delivered: '✅',
        cancelled: '❌',
        rejected: '❌'
      }[latestOrder.status] || '📦';

      replyText = `${statusEmoji} *Order Status: #${latestOrder.order_no}*\n\n` +
        `• Status: *${latestOrder.status.toUpperCase()}*\n` +
        `• Total: ₹${(latestOrder.total_paise / 100).toFixed(2)}\n` +
        `• Type: ${latestOrder.order_type.toUpperCase()}\n\n` +
        `🔴 *Live Map & Kitchen Tracking:*\n${appUrl}/track/${latestOrder.public_token}`;
    } else {
      replyText = `You don't have any recent orders with *${restaurant.name}* yet.\n\n` +
        `Hungry? Explore our delicious menu here:\n👉 ${menuLink}`;
    }
  }
  // 2. Repeat Past Order Command (1 / repeat / reorder)
  else if (normalizedText.includes('repeat') || normalizedText === '1' || normalizedText.includes('reorder')) {
    if (latestOrder) {
      // Fetch items of the previous order
      const { rows: orderItems } = await query(
        `SELECT item_name, quantity, line_total_paise FROM order_items WHERE order_id = $1`,
        [latestOrder.id]
      );
      const itemsList = orderItems.map(i => `• ${i.quantity}x ${i.item_name}`).join('\n');

      replyText = `🔁 *Repeat Previous Order (#${latestOrder.order_no})*\n\n` +
        `Items:\n${itemsList}\n\n` +
        `Total: *₹${(latestOrder.total_paise / 100).toFixed(2)}*\n\n` +
        `👉 *Tap to Reorder in 1-Click:*\n${appUrl}/${restaurant.slug}?reorder=${latestOrder.id}`;
    } else {
      replyText = `No past orders found to repeat!\n\nBrowse our fresh menu and place your first order:\n👉 ${menuLink}`;
    }
  }
  // 3. Menu Command (2 / menu / food / list)
  else if (normalizedText === '2' || normalizedText.includes('menu') || normalizedText === 'food') {
    // Get popular categories
    const { rows: categories } = await query(
      `SELECT name FROM menu_categories WHERE restaurant_id = $1 AND is_active = true ORDER BY sort_order ASC LIMIT 5`,
      [restaurant.id]
    );
    const catList = categories.map(c => `• ${c.name}`).join('\n');

    replyText = `🍽️ *${restaurant.name} — Full Digital Menu*\n\n` +
      `Our Top Categories:\n${catList || '• Starters\n• Main Course\n• Breads & Rice'}\n\n` +
      `⚡ Enjoy 0% commission prices directly with us!\n\n` +
      `👉 *Order Online Now:*\n${menuLink}`;
  }
  // 4. Smart Dish Search (e.g. user types "biryani", "pizza", "burger", "paneer", "cake")
  else if (normalizedText.length >= 3 && !['hi', 'hello', 'hey', 'start', 'help', 'namaste', 'halo', 'namaskar'].includes(normalizedText)) {
    const { rows: matchingItems } = await query(
      `SELECT m.id, m.name, m.base_price_paise, m.veg_type, c.name as category_name
       FROM menu_items m
       JOIN menu_categories c ON c.id = m.category_id
       WHERE m.restaurant_id = $1 
         AND m.is_available = true
         AND (m.name ILIKE '%' || $2 || '%' OR m.description ILIKE '%' || $2 || '%' OR c.name ILIKE '%' || $2 || '%')
       LIMIT 4`,
      [restaurant.id, normalizedText]
    );

    if (matchingItems.length > 0) {
      const itemsSummary = matchingItems.map(it => {
        const badge = it.veg_type === 'veg' ? '🟢 [Veg]' : (it.veg_type === 'egg' ? '🟡 [Egg]' : '🔴 [Non-Veg]');
        return `${badge} *${it.name}* — ₹${(it.base_price_paise / 100).toFixed(0)}`;
      }).join('\n');

      replyText = `😋 *Found for "${text}":*\n\n` +
        `${itemsSummary}\n\n` +
        `👉 *Tap here to order & customize:*\n${menuLink}\n\n` +
        `Need anything else? Reply with another dish name or "menu".`;
    } else {
      // Default fallback greeting
      const custName = customer?.name ? ` ${customer.name}` : '';
      replyText = `👋 Welcome${custName} to *${restaurant.name}*!\n\n` +
        `Order fresh food directly from us at the best prices:\n\n` +
        (latestOrder ? `1️⃣ *Repeat previous order* (Reply "1")\n` : '') +
        `2️⃣ *Browse digital menu* (Reply "2")\n` +
        (latestOrder ? `3️⃣ *Check live order status* (Reply "3")\n\n` : '\n') +
        `Or simply tap to order:\n👉 ${menuLink}`;
    }
  }
  // 5. Greeting / Welcome
  else {
    const custName = customer?.name ? ` ${customer.name}` : '';
    if (latestOrder) {
      replyText = `👋 Welcome back${custName} to *${restaurant.name}*!\n\n` +
        `How can we serve you today?\n\n` +
        `1️⃣ *Repeat previous order* (Reply "1")\n` +
        `2️⃣ *Browse full menu* (Reply "2")\n` +
        `3️⃣ *Track active order* (Reply "3")\n\n` +
        `Or search any dish (e.g. type "biryani" or "paneer")!\n\n` +
        `👉 View Menu: ${menuLink}`;
    } else {
      replyText = `👋 Welcome to *${restaurant.name}*!\n\n` +
        `Get delicious, hot meals delivered straight from our kitchen with exclusive direct discounts:\n\n` +
        `👉 *View Menu & Order:* ${menuLink}\n\n` +
        `Type any dish name (e.g. "Pizza", "Biryani") to search our menu anytime!`;
    }
  }

  // Send outbound reply
  await sendMessage(restaurant.id, cleanPhone, 'interactive_reply', replyText, latestOrder?.id || null);

  return { reply: replyText, restaurant: restaurant.name };
}

/**
 * WhatsApp Webhook Event Receiver (Meta standard)
 * POST /api/whatsapp/webhook
 */
router.post('/webhook', async (req, res) => {
  // Acknowledge immediately within 3s as required by Meta Cloud API
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;

            // 1. Handle Status Updates (sent / delivered / read / failed)
            const statuses = value.statuses || [];
            for (const st of statuses) {
              const waMsgId = st.id;
              const newStatus = st.status; // 'delivered', 'read', 'failed'
              if (waMsgId && newStatus) {
                await query(
                  `UPDATE whatsapp_messages SET status = $1 WHERE wa_message_id = $2`,
                  [newStatus, waMsgId]
                ).catch(() => {});
              }
            }

            // 2. Handle Inbound Messages
            const messages = value.messages || [];
            const displayPhone = value.metadata?.display_phone_number;

            for (const msg of messages) {
              const fromPhone = msg.from;
              let text = '';

              if (msg.type === 'text') {
                text = msg.text?.body || '';
              } else if (msg.type === 'interactive') {
                text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
              } else if (msg.type === 'button') {
                text = msg.button?.text || '';
              }

              if (fromPhone && text) {
                console.log(`📩 [WhatsApp Webhook Inbound] From: ${fromPhone} | Message: "${text}"`);
                await handleIncomingMessage(fromPhone, text, displayPhone);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
  }
});

/**
 * Simulator Endpoint for Local & Web UI Testing
 * POST /api/whatsapp/simulate
 * Body: { phone: "9876543210", message: "Hi", restaurantPhone: "919999999999" }
 */
router.post('/simulate', async (req, res) => {
  try {
    const { phone, message, restaurantPhone } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    const result = await handleIncomingMessage(phone, message, restaurantPhone);
    res.json({
      success: true,
      sender: phone,
      input: message,
      botResponse: result.reply,
      restaurant: result.restaurant
    });
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Send Live Test WhatsApp Message
 * POST /api/whatsapp/test-send
 * Body: { phone: "919876543210", message: "Optional custom message" }
 */
router.post('/test-send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'phone number is required (e.g. 919876543210)' });
    }

    const { rows: [restaurant] } = await query(
      `SELECT * FROM restaurants WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
    );

    const testText = message || `🚀 *DirectDine WhatsApp Bot Test*\n\n` +
      `Your WhatsApp integration is working successfully!\n` +
      `Reply "Hi" to this message to start ordering fresh food.`;

    const sendResult = await sendMessage(
      restaurant?.id,
      phone,
      'test_message',
      testText
    );

    res.json({
      success: true,
      recipient: phone,
      liveMode: isLiveMode(),
      metaMessageId: sendResult.waMessageId,
      status: sendResult.status,
      error: sendResult.error,
      info: isLiveMode()
        ? 'Sent live via Meta WhatsApp Business Cloud API'
        : 'Logged in Mock Mode (configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env for live Meta delivery)'
    });
  } catch (err) {
    console.error('Test send error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * WhatsApp Cloud API Health & Configuration Status
 * GET /api/whatsapp/status
 */
router.get('/status', (req, res) => {
  res.json({
    liveMode: isLiveMode(),
    configured: {
      hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      hasVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      hasAppSecret: Boolean(process.env.WHATSAPP_APP_SECRET),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? '***' + process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4) : null,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'food-app-wa-verify-token'
    },
    webhookUrl: `${process.env.API_URL || 'http://localhost:5001'}/api/whatsapp/webhook`,
    appUrl: process.env.APP_URL || 'http://localhost:3000'
  });
});

/**
 * WhatsApp Messages Log
 * GET /api/whatsapp/messages
 */
router.get('/messages', async (req, res) => {
  try {
    const { rows: messages } = await query(
      `SELECT wm.*, r.name as restaurant_name, c.name as customer_name, c.phone as customer_phone
       FROM whatsapp_messages wm
       LEFT JOIN restaurants r ON r.id = wm.restaurant_id
       LEFT JOIN customers c ON c.id = wm.customer_id
       ORDER BY wm.created_at DESC
       LIMIT 30`
    );

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

