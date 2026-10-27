/**
 * Admin Routes — Super Admin Panel
 * Restaurant onboarding, management, platform-level controls
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { superAdminAuth, staffAuth } = require('../middleware/staffAuth');
const QRCode = require('qrcode');

// ========== RESTAURANT MANAGEMENT ==========

// GET /api/admin/restaurants — List all restaurants
router.get('/restaurants', staffAuth, asyncHandler(async (req, res) => {
  if (!req.staff.isSuperAdmin) throw new ApiError(403, 'Super admin only');

  const { rows: restaurants } = await query(
    `SELECT r.*, 
       (SELECT count(*)::int FROM orders WHERE restaurant_id = r.id AND status = 'delivered') AS total_orders,
       (SELECT COALESCE(sum(total_paise), 0)::bigint FROM orders WHERE restaurant_id = r.id AND status = 'delivered') AS total_revenue,
       (SELECT count(*)::int FROM menu_items WHERE restaurant_id = r.id) AS menu_items_count
     FROM restaurants r ORDER BY r.created_at DESC`
  );

  res.json({ success: true, restaurants });
}));

// GET /api/admin/restaurants/:id — Single restaurant detail
router.get('/restaurants/:id', staffAuth, asyncHandler(async (req, res) => {
  if (!req.staff.isSuperAdmin) throw new ApiError(403, 'Super admin only');

  const { rows: [restaurant] } = await query(
    'SELECT * FROM restaurants WHERE id = $1',
    [req.params.id]
  );
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const { rows: staff } = await query(
    'SELECT id, name, phone, email, role, is_active FROM staff_users WHERE restaurant_id = $1',
    [req.params.id]
  );

  const { rows: hours } = await query(
    'SELECT * FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week',
    [req.params.id]
  );

  res.json({ success: true, restaurant, staff, hours });
}));

// POST /api/admin/restaurants — Onboard new restaurant
router.post('/restaurants', staffAuth, asyncHandler(async (req, res) => {
  if (!req.staff.isSuperAdmin) throw new ApiError(403, 'Super admin only');

  const slug = req.body.slug;
  const name = req.body.name;
  const description = req.body.description || '';
  const phone = req.body.phone;
  const addressLine = req.body.addressLine || req.body.address_line || req.body.address || '';
  const city = req.body.city || 'Mumbai';
  const pincode = req.body.pincode || '400001';
  const latitude = req.body.latitude || 19.076090;
  const longitude = req.body.longitude || 72.877426;
  const deliveryRadiusM = req.body.deliveryRadiusM || req.body.delivery_radius_m || 5000;
  const deliveryFeePaise = req.body.deliveryFeePaise !== undefined ? req.body.deliveryFeePaise : (req.body.delivery_fee_paise !== undefined ? req.body.delivery_fee_paise : 3000);
  const freeDeliveryAbovePaise = req.body.freeDeliveryAbovePaise || req.body.free_delivery_above_paise || 50000;
  const minOrderPaise = req.body.minOrderPaise !== undefined ? req.body.minOrderPaise : (req.body.min_order_paise !== undefined ? req.body.min_order_paise : 15000);
  const avgPrepMinutes = req.body.avgPrepMinutes || req.body.avg_prep_minutes || 25;
  const acceptsCod = req.body.acceptsCod ?? req.body.accepts_cod ?? true;
  const acceptsPickup = req.body.acceptsPickup ?? req.body.accepts_pickup ?? true;
  const gstPercent = req.body.gstPercent || req.body.gst_percent || 5.00;
  const fssaiNumber = req.body.fssaiNumber || req.body.fssai_number || '';
  const gstin = req.body.gstin || '';
  const plan = req.body.plan || 'pilot';

  const ownerName = req.body.ownerName || req.body.owner_name || (name + ' Owner');
  const ownerPhone = req.body.ownerPhone || req.body.owner_phone || phone;
  const ownerEmail = req.body.ownerEmail || req.body.owner_email || `${slug}@foodapp.in`;
  const ownerPassword = req.body.ownerPassword || req.body.owner_password;
  const hours = req.body.hours;

  const upiId = req.body.upiId || req.body.upi_id || 'directdine@okhdfcbank';

  if (!slug || !name || !phone || !addressLine || !city) {
    throw new ApiError(400, 'Required: slug, name, phone, address, city');
  }
  if (!ownerPhone || !ownerPassword) {
    throw new ApiError(400, 'Owner phone and password required');
  }

  return transaction(async (client) => {
    // 1. Create restaurant
    const { rows: [restaurant] } = await client.query(
      `INSERT INTO restaurants (
        slug, name, description, phone, address_line, city, pincode,
        latitude, longitude, delivery_radius_m, delivery_fee_paise,
        free_delivery_above_paise, min_order_paise, avg_prep_minutes,
        accepts_cod, accepts_pickup, gst_percent, fssai_number, gstin, plan, upi_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [slug, name, description, phone, addressLine, city, pincode,
       latitude, longitude, deliveryRadiusM, deliveryFeePaise,
       freeDeliveryAbovePaise, minOrderPaise, avgPrepMinutes,
       acceptsCod, acceptsPickup, gstPercent, fssaiNumber, gstin, plan, upiId]
    );

    // 2. Create owner staff user
    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const ownerPhoneNormalized = ownerPhone.startsWith('+') ? ownerPhone : `+91${ownerPhone.replace(/^0/, '')}`;
    
    await client.query(
      `INSERT INTO staff_users (restaurant_id, name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'owner')`,
      [restaurant.id, ownerName || name + ' Owner', ownerPhoneNormalized, ownerEmail, passwordHash]
    );

    // 3. Create default hours if provided
    if (hours && hours.length > 0) {
      for (const h of hours) {
        await client.query(
          `INSERT INTO restaurant_hours (restaurant_id, day_of_week, opens_at, closes_at)
           VALUES ($1, $2, $3, $4)`,
          [restaurant.id, h.dayOfWeek, h.opensAt, h.closesAt]
        );
      }
    } else {
      // Default: Mon-Sun 10 AM - 10 PM
      for (let d = 0; d <= 6; d++) {
        await client.query(
          `INSERT INTO restaurant_hours (restaurant_id, day_of_week, opens_at, closes_at)
           VALUES ($1, $2, '10:00', '22:00')`,
          [restaurant.id, d]
        );
      }
    }

    // 4. Generate links
    const menuUrl = `${process.env.APP_URL}/${restaurant.slug}`;
    const whatsappLink = `https://wa.me/91${phone.replace(/\+91/, '').replace(/\D/g, '')}?text=Hi`;

    res.status(201).json({
      success: true,
      restaurant,
      links: {
        menuUrl,
        whatsappLink,
        qrCodeUrl: `/api/admin/restaurants/${restaurant.id}/qr`
      }
    });
  });
}));

// PUT /api/admin/restaurants/:id — Update restaurant
router.put('/restaurants/:id', staffAuth, asyncHandler(async (req, res) => {
  if (!req.staff.isSuperAdmin) throw new ApiError(403, 'Super admin only');

  const {
    name, description, phone, addressLine, city, pincode,
    latitude, longitude, isActive, isOpen, plan,
    whatsappPhoneNumberId, whatsappWabaId, razorpayAccountId,
    upiId, upi_id
  } = req.body;

  const { rows: [restaurant] } = await query(
    `UPDATE restaurants SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      phone = COALESCE($3, phone),
      address_line = COALESCE($4, address_line),
      city = COALESCE($5, city),
      pincode = COALESCE($6, pincode),
      latitude = COALESCE($7, latitude),
      longitude = COALESCE($8, longitude),
      is_active = COALESCE($9, is_active),
      is_open = COALESCE($10, is_open),
      plan = COALESCE($11, plan),
      whatsapp_phone_number_id = COALESCE($12, whatsapp_phone_number_id),
      whatsapp_waba_id = COALESCE($13, whatsapp_waba_id),
      razorpay_account_id = COALESCE($14, razorpay_account_id),
      upi_id = COALESCE($15, upi_id)
     WHERE id = $16 RETURNING *`,
    [name, description, phone, addressLine, city, pincode,
     latitude, longitude, isActive, isOpen, plan,
     whatsappPhoneNumberId, whatsappWabaId, razorpayAccountId,
     upiId || upi_id,
     req.params.id]
  );

  if (!restaurant) throw new ApiError(404, 'Restaurant not found');
  res.json({ success: true, restaurant });
}));

// GET /api/admin/restaurants/:id/qr — Generate QR code
router.get('/restaurants/:id/qr', asyncHandler(async (req, res) => {
  const { rows: [restaurant] } = await query(
    'SELECT slug, name FROM restaurants WHERE id = $1',
    [req.params.id]
  );
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const menuUrl = `${process.env.APP_URL}/${restaurant.slug}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  res.json({
    success: true,
    qrCode: qrDataUrl,
    menuUrl,
    restaurantName: restaurant.name
  });
}));

// ========== PLATFORM ANALYTICS ==========

// GET /api/admin/analytics — Platform-wide stats
router.get('/analytics', staffAuth, asyncHandler(async (req, res) => {
  if (!req.staff.isSuperAdmin) throw new ApiError(403, 'Super admin only');

  const { rows: [stats] } = await query(`
    SELECT
      (SELECT count(*)::int FROM restaurants WHERE is_active = true) AS active_restaurants,
      (SELECT count(*)::int FROM customers) AS total_customers,
      (SELECT count(*)::int FROM orders WHERE status = 'delivered') AS total_orders,
      (SELECT COALESCE(sum(total_paise), 0)::bigint FROM orders WHERE status = 'delivered') AS total_gmv,
      (SELECT count(*)::int FROM orders WHERE status = 'delivered' 
        AND placed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata')) AS today_orders,
      (SELECT COALESCE(sum(total_paise), 0)::bigint FROM orders WHERE status = 'delivered'
        AND placed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata')) AS today_gmv
  `);

  res.json({ success: true, ...stats });
}));

module.exports = router;
