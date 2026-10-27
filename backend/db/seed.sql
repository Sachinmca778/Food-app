-- =====================================================================
-- Seed data: Demo restaurant with full menu for testing
-- =====================================================================

-- Super Admin user (password: admin123)
INSERT INTO staff_users (id, name, phone, email, password_hash, role, is_super_admin)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Super Admin',
  '+919999999999',
  'admin@foodapp.in',
  '$2a$10$etDzKLIRmfWXHSAPzGCHeefseKOEgH6EsVtRdnLfVwJbsrY5RjllO',
  'owner',
  true
) ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Demo Restaurant: Spice Garden
INSERT INTO restaurants (
  id, slug, name, description, phone, address_line, city, pincode,
  latitude, longitude, delivery_radius_m, delivery_fee_paise,
  free_delivery_above_paise, min_order_paise, avg_prep_minutes,
  fssai_number, gst_percent, whatsapp_phone_number_id
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'spice-garden',
  'Spice Garden',
  'Authentic North Indian cuisine with a modern twist. Fresh ingredients, bold flavors.',
  '+919876543210',
  '42, MG Road, Near City Mall',
  'Mumbai',
  '400001',
  19.076090,
  72.877426,
  5000,
  3000,
  50000,
  15000,
  25,
  '12345678901234',
  5.00,
  'mock_phone_id_spicegarden'
) ON CONFLICT (slug) DO NOTHING;

-- Restaurant Owner (password: spice123)
INSERT INTO staff_users (id, restaurant_id, name, phone, email, password_hash, role)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Rajesh Kumar',
  '+919876543210',
  'rajesh@spicegarden.in',
  '$2a$10$.VfWux.M1lFH1984ATFXC.NN6y8P8PXWC2EoU1GBMsbZYIx0qOI/2',
  'owner'
) ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Restaurant Hours (Mon-Sun, 11 AM to 11 PM)
INSERT INTO restaurant_hours (restaurant_id, day_of_week, opens_at, closes_at)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  d,
  '11:00'::time,
  '23:00'::time
FROM generate_series(0, 6) AS d
ON CONFLICT DO NOTHING;

-- ==================== MENU CATEGORIES ====================
INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Starters', 1),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Main Course', 2),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Breads', 3),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Rice & Biryani', 4),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Beverages', 5),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Desserts', 6)
ON CONFLICT DO NOTHING;

-- ==================== MENU ITEMS ====================
-- Starters
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type, is_bestseller) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Paneer Tikka', 'Smoky tandoor-grilled cottage cheese marinated in yogurt & spices', 28000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Chicken Seekh Kebab', 'Minced chicken kebabs with aromatic herbs, charcoal grilled', 32000, 'non_veg', true),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Veg Spring Roll', 'Crispy rolls stuffed with mixed vegetables & noodles', 18000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Fish Amritsari', 'Battered and deep-fried fish fillets with tangy dip', 35000, 'non_veg', false),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Hara Bhara Kebab', 'Green pea and spinach patties with mint chutney', 22000, 'veg', false)
ON CONFLICT DO NOTHING;

-- Main Course
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type, is_bestseller) VALUES
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Butter Chicken', 'Tender chicken in rich tomato-butter gravy', 34000, 'non_veg', true),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Paneer Butter Masala', 'Soft paneer cubes in creamy tomato-cashew gravy', 28000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Dal Makhani', 'Slow-cooked black lentils with butter and cream', 24000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Chicken Biryani Masala', 'Spicy chicken in rich curry, pairs with biryani rice', 32000, 'non_veg', false),
  ('d0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Palak Paneer', 'Fresh spinach purée with soft paneer cubes', 26000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Mutton Rogan Josh', 'Tender mutton in aromatic Kashmiri-style curry', 42000, 'non_veg', false),
  ('d0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Chole Masala', 'Punjabi chickpea curry with tangy spices', 20000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   'Egg Curry', 'Boiled eggs in onion-tomato masala gravy', 22000, 'egg', false)
ON CONFLICT DO NOTHING;

-- Breads
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type) VALUES
  ('d0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
   'Butter Naan', 'Soft leavened bread brushed with butter', 6000, 'veg'),
  ('d0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
   'Garlic Naan', 'Naan topped with fresh garlic and coriander', 7000, 'veg'),
  ('d0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
   'Tandoori Roti', 'Whole wheat bread baked in tandoor', 4000, 'veg'),
  ('d0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
   'Laccha Paratha', 'Multi-layered flaky paratha', 6000, 'veg'),
  ('d0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
   'Cheese Naan', 'Stuffed with melted cheese, grilled in tandoor', 9000, 'veg')
ON CONFLICT DO NOTHING;

-- Rice & Biryani
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type, is_bestseller) VALUES
  ('d0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
   'Chicken Dum Biryani', 'Slow-cooked layered biryani with tender chicken, raita included', 32000, 'non_veg', true),
  ('d0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
   'Veg Biryani', 'Fragrant basmati rice with seasonal vegetables', 24000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
   'Jeera Rice', 'Basmati rice tempered with cumin seeds', 16000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
   'Mutton Biryani', 'Rich Hyderabadi-style mutton biryani', 38000, 'non_veg', false)
ON CONFLICT DO NOTHING;

-- Beverages
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type) VALUES
  ('d0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Masala Chaas', 'Spiced buttermilk with cumin and mint', 6000, 'veg'),
  ('d0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Mango Lassi', 'Thick yogurt shake with alphonso mango', 12000, 'veg'),
  ('d0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Sweet Lassi', 'Classic thick yogurt drink', 8000, 'veg'),
  ('d0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
   'Fresh Lime Soda', 'Sweet or salty, freshly squeezed', 7000, 'veg')
ON CONFLICT DO NOTHING;

-- Desserts
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type) VALUES
  ('d0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006',
   'Gulab Jamun (2 pcs)', 'Soft milk dumplings soaked in rose-scented syrup', 10000, 'veg'),
  ('d0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006',
   'Rasmalai (2 pcs)', 'Soft paneer discs in saffron milk', 12000, 'veg'),
  ('d0000000-0000-0000-0000-000000000052', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006',
   'Kulfi (Malai)', 'Traditional Indian ice cream, rich and creamy', 10000, 'veg')
ON CONFLICT DO NOTHING;

-- ==================== ITEM VARIANTS ====================
-- Paneer Tikka: Half / Full
INSERT INTO menu_item_variants (item_id, name, price_paise, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Half', 16000, 1),
  ('d0000000-0000-0000-0000-000000000001', 'Full', 28000, 2)
ON CONFLICT DO NOTHING;

-- Chicken Dum Biryani: Single / Double
INSERT INTO menu_item_variants (item_id, name, price_paise, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000030', 'Single', 22000, 1),
  ('d0000000-0000-0000-0000-000000000030', 'Family Pack', 58000, 2)
ON CONFLICT DO NOTHING;

-- ==================== ADDON GROUPS ====================
INSERT INTO addon_groups (id, restaurant_id, name, min_select, max_select) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Extra Add-ons', 0, 3),
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Spice Level', 0, 1)
ON CONFLICT DO NOTHING;

INSERT INTO addons (id, group_id, name, price_paise) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Extra Cheese', 3000),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Extra Butter', 2000),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Extra Paneer', 5000),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'Mild', 0),
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'Medium', 0),
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000002', 'Extra Spicy', 0)
ON CONFLICT DO NOTHING;

-- Link addons to items
INSERT INTO menu_item_addon_groups (item_id, group_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000030', 'e0000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- ==================== COUPONS ====================
INSERT INTO coupons (id, restaurant_id, code, discount_type, discount_value, max_discount_paise, min_order_paise, usage_limit_per_customer, first_order_only) VALUES
  ('fa000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'WELCOME10', 'percent', 10, 10000, 20000, 1, true),
  ('fa000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'FLAT50', 'flat', 5000, NULL, 30000, 3, false)
ON CONFLICT DO NOTHING;

-- ==================== DEMO CUSTOMER ====================
INSERT INTO customers (id, phone, name) VALUES
  ('fb000000-0000-0000-0000-000000000001', '+919123456789', 'Priya Sharma')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customer_addresses (customer_id, label, address_line, landmark, pincode, latitude, longitude, is_default) VALUES
  ('fb000000-0000-0000-0000-000000000001', 'Home', '15, Linking Road, Bandra West', 'Near Bandra Station', '400050', 19.059984, 72.836578, true)
ON CONFLICT DO NOTHING;

INSERT INTO restaurant_customers (restaurant_id, customer_id, total_orders, total_spent_paise, whatsapp_opt_in, source) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'fb000000-0000-0000-0000-000000000001', 0, 0, true, 'qr')
ON CONFLICT DO NOTHING;

-- ==================== SECOND DEMO RESTAURANT: Chai & Bites ====================
INSERT INTO restaurants (
  id, slug, name, description, phone, address_line, city, pincode,
  latitude, longitude, delivery_radius_m, delivery_fee_paise,
  min_order_paise, avg_prep_minutes, gst_percent
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'chai-and-bites',
  'Chai & Bites',
  'Quick bites and refreshing chai for every mood. South Indian snacks specialist.',
  '+919988776655',
  '88, FC Road, Shivajinagar',
  'Pune',
  '411005',
  18.520430,
  73.856744,
  3000,
  2000,
  10000,
  15,
  5.00
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'Chai & Coffee', 1),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Snacks', 2),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'South Indian', 3)
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, base_price_paise, veg_type, is_bestseller) VALUES
  ('d0000000-0000-0000-0000-000000000060', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010',
   'Cutting Chai', 'Strong Bombay-style half chai', 2000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000061', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010',
   'Filter Coffee', 'Authentic South Indian filter coffee', 4000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000062', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011',
   'Samosa (2 pcs)', 'Crispy potato-filled pastries with chutney', 5000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000063', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011',
   'Vada Pav', 'Mumbai-style spiced potato fritter in bun', 4000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000064', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012',
   'Masala Dosa', 'Crispy rice crepe with spiced potato filling', 12000, 'veg', true),
  ('d0000000-0000-0000-0000-000000000065', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012',
   'Idli Sambar (4 pcs)', 'Steamed rice cakes with sambar & chutney', 8000, 'veg', false),
  ('d0000000-0000-0000-0000-000000000066', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000012',
   'Medu Vada (2 pcs)', 'Crispy urad dal fritters with sambar', 6000, 'veg', false)
ON CONFLICT DO NOTHING;
