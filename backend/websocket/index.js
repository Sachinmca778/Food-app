/**
 * Socket.io Setup
 * Manages real-time connections for restaurant dashboards and order tracking
 */
const { Server } = require('socket.io');

function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Restaurant dashboard room join
    socket.on('join:restaurant', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`🔌 Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    // Customer tracking page room join
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`🔌 Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('leave:restaurant', (restaurantId) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
}

module.exports = { initWebSocket };
