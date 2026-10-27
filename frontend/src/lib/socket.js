/**
 * Real-time Socket.io Client Helper
 */
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to WebSocket server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Disconnected from WebSocket server');
    });
  }

  return socket;
}
