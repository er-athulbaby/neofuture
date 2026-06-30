-- Run once on your server: psql $DATABASE_URL -f sql/add-variants.sql

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  cart_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  reminded_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_pending ON abandoned_carts(updated_at) WHERE converted = false;
