/**
 * Notification Service
 * Orchestrates all notifications: WhatsApp + WebSocket
 * Called after every order status change
 */
const whatsappService = require('./whatsappService');

let io = null; // Socket.io instance, set from server.js

function setSocketIO(socketIO) {
  io = socketIO;
}

/**
 * Notify on order status change
 * Sends WebSocket event + WhatsApp message
 */
async function notifyOrderStatusChange(order, orderItems, fromStatus, toStatus) {
  try {
    // 1. WebSocket: notify restaurant dashboard
    if (io) {
      io.to(`restaurant:${order.restaurant_id}`).emit('order:update', {
        orderId: order.id,
        orderNo: order.order_no,
        fromStatus,
        toStatus,
        order
      });
    }

    // 2. WhatsApp messages based on status
    switch (toStatus) {
      case 'placed':
        // Notify restaurant owner
        await whatsappService.sendOrderToRestaurant(
          order, orderItems || [],
          order.restaurant_phone
        );
        // Notify customer
        await whatsappService.sendOrderConfirmation(order, order.restaurant_name);
        break;

      case 'paid':
        // Notify restaurant of payment received
        if (io) {
          io.to(`restaurant:${order.restaurant_id}`).emit('order:paid', {
            orderId: order.id,
            orderNo: order.order_no
          });
        }
        break;

      case 'accepted':
        await whatsappService.sendOrderAccepted(order, order.prep_minutes);
        break;

      case 'rejected':
        await whatsappService.sendOrderRejected(order, order.cancel_reason);
        break;

      case 'ready':
        await whatsappService.sendOrderReady(order);
        break;

      case 'out_for_delivery':
        await whatsappService.sendOutForDelivery(order);
        break;

      case 'delivered':
        await whatsappService.sendDelivered(order);
        // Schedule rating request (30 min later - handled by cron)
        break;

      case 'cancelled':
        // Already handled in specific route
        break;
    }

    // 3. WebSocket: notify customer tracking page
    if (io) {
      io.to(`order:${order.id}`).emit('order:statusChange', {
        orderId: order.id,
        status: toStatus,
        order
      });
    }

  } catch (err) {
    console.error('❌ Notification error:', err.message);
    // Don't throw — notifications should not break order flow
  }
}

/**
 * Notify new order (sound alert on dashboard)
 */
async function notifyNewOrder(order, orderItems) {
  if (io) {
    io.to(`restaurant:${order.restaurant_id}`).emit('order:new', {
      orderId: order.id,
      orderNo: order.order_no,
      items: orderItems,
      total: order.total_paise,
      type: order.order_type,
      source: order.source
    });
  }
}

module.exports = {
  setSocketIO,
  notifyOrderStatusChange,
  notifyNewOrder
};
