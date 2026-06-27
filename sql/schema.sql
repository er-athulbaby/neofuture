-- NeoFuture Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AUTH TABLES (NextAuth v5 + pg adapter)
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  avatar VARCHAR(500),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- ============================================================
-- PRODUCT CATALOG
-- ============================================================

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image VARCHAR(500),
  display_order INTEGER DEFAULT 0
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2),
  images JSONB DEFAULT '[]',
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ingredients TEXT,
  how_to_use TEXT,
  flavor VARCHAR(100),
  weight VARCHAR(50),
  sku VARCHAR(100) UNIQUE,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- ORDERS & PAYMENTS
-- ============================================================

CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percent', 'flat')),
  value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  guest_email VARCHAR(255),
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  shipping NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  coupon_id INTEGER REFERENCES coupons(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(500),
  shipping_address JSONB NOT NULL,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- WELLNESS QUIZ (3-PATH BRANCHING)
-- ============================================================

CREATE TABLE quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_key VARCHAR(100),
  age_group VARCHAR(20),
  main_concern VARCHAR(100),
  quiz_path VARCHAR(50) CHECK (quiz_path IN ('pcos','sleep_stress','energy')),
  answers JSONB DEFAULT '{}',
  hormone_score INTEGER,
  stress_score INTEGER,
  energy_score INTEGER,
  recommended_product_id INTEGER REFERENCES products(id),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  quiz_session_id INTEGER REFERENCES quiz_sessions(id),
  recommended_product VARCHAR(255),
  quiz_path VARCHAR(50),
  hormone_score INTEGER,
  stress_score INTEGER,
  energy_score INTEGER,
  is_contacted BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_scores (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hormone_score INTEGER,
  stress_score INTEGER,
  energy_score INTEGER,
  quiz_session_id INTEGER REFERENCES quiz_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERIOD TRACKER
-- ============================================================

CREATE TABLE period_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow VARCHAR(20) CHECK (flow IN ('spotting','light','medium','heavy')),
  symptoms JSONB DEFAULT '[]',
  mood VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE period_predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_start DATE,
  predicted_end DATE,
  avg_cycle_length INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- BABY TOOLS
-- ============================================================

CREATE TABLE baby_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('male','female')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vaccination_logs (
  id SERIAL PRIMARY KEY,
  baby_id INTEGER NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  given_date DATE,
  batch_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tool_saves (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type VARCHAR(50) NOT NULL CHECK (tool_type IN ('due_date','weight_gain','growth_chart','baby_food')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS
-- ============================================================

CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  product_id INTEGER REFERENCES products(id),
  data JSONB DEFAULT '{}',
  ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_wellness_leads_created ON wellness_leads(created_at);
CREATE INDEX idx_wellness_leads_whatsapp ON wellness_leads(whatsapp);
CREATE INDEX idx_period_logs_user ON period_logs(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_vaccination_logs_baby ON vaccination_logs(baby_id);
CREATE INDEX idx_baby_profiles_user ON baby_profiles(user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO categories (name, slug, description, display_order) VALUES
('Nutraceuticals', 'nutraceuticals', 'Science-backed nutritional supplements for women', 1),
('Period Care', 'period-care', 'Menstrual cups, heat patches and period wellness products', 2),
('Pregnancy', 'pregnancy', 'Support products for expectant mothers', 3),
('Baby Care', 'baby-care', 'Gentle products for your little one', 4);
