/**
 * Food App Backend API Server
 * Express + Socket.io + PostgreSQL
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); // Fallback to root .env if present
const http = require('http');
const express = require('express');
const cors = require('cors');

const fs = require('fs');

const { errorHandler } = require('./middleware/errorHandler');
const { initWebSocket } = require('./websocket');
const { setSocketIO } = require('./services/notificationService');
const { initCronJobs } = require('./cron');

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const trackingRoutes = require('./routes/tracking');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const ratingRoutes = require('./routes/ratings');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
const io = initWebSocket(server);
setSocketIO(io);

// Enable CORS for all origins in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Body Parsers (allow high-resolution food image uploads up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving for uploaded food photos
app.use('/uploads', express.static(uploadsDir));


// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'food-app-backend'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'food-app-backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/whatsapp', whatsappRoutes);

const { pool, query } = require('./db/pool');


// Auto-initialize tables if starting on an empty production PostgreSQL DB
async function autoInitDatabase() {
  try {
    const { rows } = await query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'restaurants'
      LIMIT 1
    `);
    if (rows.length === 0) {
      console.log('🔄 Fresh database detected! Initializing schema & seed data...');
      const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
      if (pool.exec) await pool.exec(schema);
      else await pool.query(schema);

      const seed = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf8');
      if (pool.exec) await pool.exec(seed);
      else await pool.query(seed);
      console.log('✅ Database schema and seed initialized successfully!');
    }
  } catch (err) {
    // Silent notice in case schema check differs across engines
    console.log('ℹ️ Database check completed');
  }
}

// Error Handling Middleware
app.use(errorHandler);

// Start Cron
initCronJobs();

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await autoInitDatabase();
  console.log(`\n==========================================`);
  console.log(`🚀 Food App Backend API running on :${PORT}`);
  console.log(`🔌 WebSocket server active`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 WhatsApp Mode: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'LIVE (Meta Cloud API)' : 'MOCK (Console & DB)'}`);
  console.log(`==========================================\n`);
});

module.exports = { app, server, io };

