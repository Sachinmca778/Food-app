/**
 * Restaurant Public Routes — Menu & Info (no auth needed)
 * GET /api/restaurant/:slug       — Restaurant info + hours
 * GET /api/restaurant/:slug/menu  — Full menu with categories, items, variants, addons
 */
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// GET /api/restaurant/:slug — Restaurant public info
router.get('/:slug', asyncHandler(async (req, res) => {
  const { rows: [restaurant] } = await query(
    `SELECT id, slug, name, logo_url, cover_url, description, phone,
            address_line, city, pincode, latitude, longitude,
            delivery_radius_m, delivery_fee_paise, free_delivery_above_paise,
            min_order_paise, avg_prep_minutes, accepts_cod, accepts_pickup,
            gst_percent, is_open, is_active, upi_id
     FROM restaurants WHERE slug = $1`,
    [req.params.slug]
  );

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Restaurant not found');
  }

  // Get hours
  const { rows: hours } = await query(
    'SELECT day_of_week, opens_at, closes_at FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week, opens_at',
    [restaurant.id]
  );

  res.json({
    success: true,
    restaurant: { ...restaurant, hours }
  });
}));

// GET /api/restaurant/:slug/menu — Full menu
router.get('/:slug/menu', asyncHandler(async (req, res) => {
  // Get restaurant ID & rich details
  const { rows: [restaurant] } = await query(
    `SELECT id, slug, name, logo_url, cover_url, description, phone,
            address_line, city, pincode, delivery_radius_m, delivery_fee_paise,
            free_delivery_above_paise, min_order_paise, avg_prep_minutes,
            is_open, is_active, upi_id
     FROM restaurants WHERE slug = $1`,
    [req.params.slug]
  );
  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Restaurant not found');
  }

  // Get categories
  const { rows: categories } = await query(
    `SELECT id, name, sort_order FROM menu_categories 
     WHERE restaurant_id = $1 AND is_active = true 
     ORDER BY sort_order`,
    [restaurant.id]
  );

  // Get all items
  const { rows: items } = await query(
    `SELECT id, category_id, name, description, image_url, base_price_paise, 
            veg_type, is_available, is_bestseller, sort_order
     FROM menu_items 
     WHERE restaurant_id = $1
     ORDER BY sort_order`,
    [restaurant.id]
  );

  // Get all variants for these items
  const itemIds = items.map(i => i.id);
  let variants = [];
  if (itemIds.length > 0) {
    const { rows } = await query(
      `SELECT id, item_id, name, price_paise, is_available, sort_order
       FROM menu_item_variants 
       WHERE item_id = ANY($1) AND is_available = true
       ORDER BY sort_order`,
      [itemIds]
    );
    variants = rows;
  }

  // Get addon groups linked to items
  let addonGroups = [];
  let addons = [];
  if (itemIds.length > 0) {
    const { rows: links } = await query(
      `SELECT miag.item_id, ag.id as group_id, ag.name, ag.min_select, ag.max_select
       FROM menu_item_addon_groups miag
       JOIN addon_groups ag ON ag.id = miag.group_id
       WHERE miag.item_id = ANY($1)`,
      [itemIds]
    );
    addonGroups = links;

    const groupIds = [...new Set(links.map(l => l.group_id))];
    if (groupIds.length > 0) {
      const { rows: addonRows } = await query(
        `SELECT id, group_id, name, price_paise, is_available
         FROM addons WHERE group_id = ANY($1) AND is_available = true`,
        [groupIds]
      );
      addons = addonRows;
    }
  }

  // Assemble menu structure
  const menu = categories.map(cat => ({
    ...cat,
    items: items
      .filter(i => i.category_id === cat.id)
      .map(item => ({
        ...item,
        variants: variants.filter(v => v.item_id === item.id),
        addonGroups: addonGroups
          .filter(ag => ag.item_id === item.id)
          .map(ag => ({
            id: ag.group_id,
            name: ag.name,
            minSelect: ag.min_select,
            maxSelect: ag.max_select,
            addons: addons.filter(a => a.group_id === ag.group_id)
          }))
      }))
  }));

  res.json({
    success: true,
    restaurant: { id: restaurant.id, slug: restaurant.slug, name: restaurant.name, isOpen: restaurant.is_open },
    menu
  });
}));

// GET /api/restaurant/:slug/coupons — Available coupons (public)
router.get('/:slug/coupons', asyncHandler(async (req, res) => {
  const { rows: [restaurant] } = await query(
    'SELECT id FROM restaurants WHERE slug = $1 AND is_active = true',
    [req.params.slug]
  );
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const { rows: coupons } = await query(
    `SELECT id, code, discount_type, discount_value, max_discount_paise, min_order_paise, first_order_only
     FROM coupons 
     WHERE restaurant_id = $1 AND is_active = true 
       AND valid_from <= now() AND (valid_until IS NULL OR valid_until > now())
       AND (usage_limit_total IS NULL OR used_count < usage_limit_total)
     ORDER BY discount_value DESC`,
    [restaurant.id]
  );

  res.json({ success: true, coupons });
}));

module.exports = router;
