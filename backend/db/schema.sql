-- =====================================================================
-- Restaurant Direct Ordering SaaS: PostgreSQL schema (multi-tenant)
-- Rules:
--   * Har tenant-table mein restaurant_id hai (row-level isolation)
--   * Paisa hamesha paise (integer) mein: Rs 540 = 54000. Float kabhi nahi
--   * Order ke time par item name/price/address ka SNAPSHOT save hota hai
--   * Timestamps hamesha timestamptz (UTC)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE veg_type AS ENUM ('veg', 'non_veg', 'egg');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'placed', 'paid', 'accepted', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('delivery', 'pickup', 'dine_in');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('upi', 'card', 'cod', 'wallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded', 'partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('initiated', 'processed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percent', 'flat');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wa_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wa_msg_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE loyalty_reason AS ENUM ('order_earned', 'order_redeemed', 'manual_adjust', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- COMMON: updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. TENANTS: restaurants + their staff
-- =====================================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  citext NOT NULL UNIQUE,
  name                  text   NOT NULL,
  logo_url              text,
  cover_url             text,
  description           text,
  phone                 text   NOT NULL,
  address_line          text   NOT NULL,
  city                  text   NOT NULL,
  pincode               text,
  latitude              numeric(9,6) NOT NULL,
  longitude             numeric(9,6) NOT NULL,
  fssai_number          text,
  gstin                 text,

  delivery_radius_m     integer NOT NULL DEFAULT 3000,
  delivery_fee_paise    integer NOT NULL DEFAULT 0,
  free_delivery_above_paise integer,
  min_order_paise       integer NOT NULL DEFAULT 0,
  avg_prep_minutes      integer NOT NULL DEFAULT 25,
  accepts_cod           boolean NOT NULL DEFAULT true,
  accepts_pickup        boolean NOT NULL DEFAULT true,
  gst_percent           numeric(4,2) NOT NULL DEFAULT 5.00,

  is_open               boolean NOT NULL DEFAULT true,
  is_active             boolean NOT NULL DEFAULT true,
  next_order_no         integer NOT NULL DEFAULT 1,

  whatsapp_phone_number_id text,
  whatsapp_waba_id         text,
  whatsapp_token_enc       text,
  razorpay_account_id      text,

  plan                  text NOT NULL DEFAULT 'pilot',
  trial_ends_at         timestamptz,
  per_order_fee_paise   integer NOT NULL DEFAULT 0,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_restaurants_updated ON restaurants;
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS restaurant_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at      time NOT NULL,
  closes_at     time NOT NULL,
  UNIQUE (restaurant_id, day_of_week, opens_at)
);

CREATE TABLE IF NOT EXISTS staff_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone         text NOT NULL UNIQUE,
  email         citext UNIQUE,
  password_hash text,
  role          staff_role NOT NULL DEFAULT 'owner',
  is_super_admin boolean NOT NULL DEFAULT false,
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff_users(restaurant_id);

-- =====================================================================
-- 2. MENU
-- =====================================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON menu_categories(restaurant_id, sort_order);

CREATE TABLE IF NOT EXISTS menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id   uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  image_url     text,
  base_price_paise integer NOT NULL CHECK (base_price_paise >= 0),
  veg_type      veg_type NOT NULL DEFAULT 'veg',
  is_available  boolean NOT NULL DEFAULT true,
  is_bestseller boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_items_restaurant ON menu_items(restaurant_id, category_id, sort_order);

DROP TRIGGER IF EXISTS trg_items_updated ON menu_items;
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS menu_item_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name          text NOT NULL,
  price_paise   integer NOT NULL CHECK (price_paise >= 0),
  is_available  boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variants_item ON menu_item_variants(item_id);

CREATE TABLE IF NOT EXISTS addon_groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  min_select    smallint NOT NULL DEFAULT 0,
  max_select    smallint NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS addons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
  name          text NOT NULL,
  price_paise   integer NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  is_available  boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_item_addon_groups (
  item_id       uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id      uuid NOT NULL REFERENCES addon_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, group_id)
);

-- =====================================================================
-- 3. CUSTOMERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         text NOT NULL UNIQUE,
  name          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         text,
  address_line  text NOT NULL,
  landmark      text,
  pincode       text,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id);

CREATE TABLE IF NOT EXISTS restaurant_customers (
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id)   ON DELETE CASCADE,
  total_orders    integer NOT NULL DEFAULT 0,
  total_spent_paise bigint NOT NULL DEFAULT 0,
  first_order_at  timestamptz,
  last_order_at   timestamptz,
  loyalty_points  integer NOT NULL DEFAULT 0,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  opt_in_at       timestamptz,
  source          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_rc_last_order ON restaurant_customers(restaurant_id, last_order_at);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  customer_id   uuid NOT NULL,
  order_id      uuid,
  points        integer NOT NULL,
  reason        loyalty_reason NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (restaurant_id, customer_id)
    REFERENCES restaurant_customers(restaurant_id, customer_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_ledger(restaurant_id, customer_id);

-- =====================================================================
-- 4. COUPONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code          citext NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value integer NOT NULL CHECK (discount_value > 0),
  max_discount_paise integer,
  min_order_paise integer NOT NULL DEFAULT 0,
  usage_limit_total integer,
  usage_limit_per_customer integer NOT NULL DEFAULT 1,
  used_count    integer NOT NULL DEFAULT 0,
  valid_from    timestamptz NOT NULL DEFAULT now(),
  valid_until   timestamptz,
  first_order_only boolean NOT NULL DEFAULT false,
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (restaurant_id, code)
);

-- =====================================================================
-- 5. ORDERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id),
  order_no        integer NOT NULL,
  customer_id     uuid NOT NULL REFERENCES customers(id),
  order_type      order_type NOT NULL DEFAULT 'delivery',
  status          order_status NOT NULL DEFAULT 'placed',

  subtotal_paise      integer NOT NULL,
  discount_paise      integer NOT NULL DEFAULT 0,
  delivery_fee_paise  integer NOT NULL DEFAULT 0,
  tax_paise           integer NOT NULL DEFAULT 0,
  packaging_paise     integer NOT NULL DEFAULT 0,
  total_paise         integer NOT NULL,
  coupon_id           uuid REFERENCES coupons(id),
  loyalty_points_used integer NOT NULL DEFAULT 0,

  delivery_name       text,
  delivery_phone      text,
  delivery_address    text,
  delivery_lat        numeric(9,6),
  delivery_lng        numeric(9,6),
  delivery_distance_m integer,

  customer_note       text,
  prep_minutes        integer,
  estimated_ready_at  timestamptz,

  rider_name          text,
  rider_phone         text,

  cancelled_by        text,
  cancel_reason       text,

  source              text,
  public_token        text NOT NULL UNIQUE
                      DEFAULT encode(gen_random_bytes(12), 'hex'),

  placed_at           timestamptz NOT NULL DEFAULT now(),
  accepted_at         timestamptz,
  ready_at            timestamptz,
  delivered_at        timestamptz,
  expires_at          timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (restaurant_id, order_no),
  CHECK (total_paise >= 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expiry ON orders(expires_at) WHERE status = 'placed';

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add FK for loyalty_ledger -> orders (if not exists)
DO $$ BEGIN
  ALTER TABLE loyalty_ledger
    ADD CONSTRAINT fk_loyalty_order FOREIGN KEY (order_id) REFERENCES orders(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id         uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name       text NOT NULL,
  variant_name    text,
  unit_price_paise integer NOT NULL,
  quantity        smallint NOT NULL CHECK (quantity > 0),
  addons          jsonb NOT NULL DEFAULT '[]',
  line_total_paise integer NOT NULL,
  note            text
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item  ON order_items(item_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status   order_status,
  to_status     order_status NOT NULL,
  changed_by    text NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id, created_at);

-- =====================================================================
-- 6. PAYMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id       uuid NOT NULL REFERENCES restaurants(id),
  method              payment_method NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  amount_paise        integer NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id   text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature  text,
  failure_reason      text,
  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS refunds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id         uuid NOT NULL REFERENCES payments(id),
  order_id           uuid NOT NULL REFERENCES orders(id),
  amount_paise       integer NOT NULL CHECK (amount_paise > 0),
  reason             text,
  status             refund_status NOT NULL DEFAULT 'initiated',
  razorpay_refund_id text UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text NOT NULL,
  event_id      text NOT NULL,
  payload       jsonb NOT NULL,
  processed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

-- =====================================================================
-- 7. WHATSAPP
-- =====================================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id   uuid REFERENCES customers(id),
  order_id      uuid REFERENCES orders(id),
  direction     wa_direction NOT NULL,
  wa_message_id text UNIQUE,
  template_name text,
  body          text,
  status        wa_msg_status NOT NULL DEFAULT 'queued',
  error_code    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_customer ON whatsapp_messages(restaurant_id, customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_order ON whatsapp_messages(order_id);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone  text NOT NULL,
  state           text NOT NULL DEFAULT 'idle',
  context         jsonb NOT NULL DEFAULT '{}',
  last_inbound_at timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, customer_phone)
);

-- =====================================================================
-- 8. RATINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_ratings (
  order_id      uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  customer_id   uuid NOT NULL REFERENCES customers(id),
  food_rating   smallint CHECK (food_rating BETWEEN 1 AND 5),
  delivery_rating smallint CHECK (delivery_rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON order_ratings(restaurant_id, created_at DESC);

-- =====================================================================
-- 9. AUTH: customer OTP
-- =====================================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         text NOT NULL,
  code_hash     text NOT NULL,
  attempts      smallint NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  consumed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at DESC);

-- =====================================================================
-- 10. HELPER: order number allocate karna
-- =====================================================================
CREATE OR REPLACE FUNCTION next_order_no(p_restaurant_id uuid) RETURNS integer AS $$
DECLARE n integer;
BEGIN
  UPDATE restaurants
     SET next_order_no = next_order_no + 1
   WHERE id = p_restaurant_id
  RETURNING next_order_no - 1 INTO n;
  RETURN n;
END;
$$ LANGUAGE plpgsql;
