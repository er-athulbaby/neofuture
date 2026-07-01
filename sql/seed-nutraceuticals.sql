-- Seed: NeoFuture Nutraceutical Products
-- Run: psql $DATABASE_URL -f sql/seed-nutraceuticals.sql

-- 1. Ensure Nutraceuticals category exists
INSERT INTO categories (name, slug, description, display_order)
VALUES ('Nutraceuticals', 'nutraceuticals', 'Targeted nutritional supplements for women''s health', 1)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert dummy products (featured, active)
WITH cat AS (SELECT id FROM categories WHERE slug = 'nutraceuticals')
INSERT INTO products (name, slug, price, sale_price, stock, description, images, is_active, is_featured, category_id)
VALUES
  (
    'Neo Balance',
    'neo-balance',
    999,
    799,
    100,
    'Neo Balance is a science-backed nutraceutical formulated to support hormonal balance, ease PCOS symptoms, and promote regular menstrual cycles. Enriched with Shatavari, Ashoka, and key micronutrients to help restore your body''s natural rhythm — naturally.',
    '["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"]',
    true,
    true,
    (SELECT id FROM cat)
  ),
  (
    'Neo Nidra',
    'neo-nidra',
    799,
    649,
    100,
    'Neo Nidra is your nightly ritual for deep, restorative sleep. A blend of Ashwagandha, L-Theanine, and Magnesium that calms the mind, eases stress, and prepares your body for quality rest — so you wake up refreshed and ready.',
    '["https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80"]',
    true,
    true,
    (SELECT id FROM cat)
  ),
  (
    'Neo Prime',
    'neo-prime',
    899,
    749,
    100,
    'Neo Prime is your everyday wellness companion — a premium multivitamin blend designed for modern women. Packed with Iron, Folate, Vitamin D3, B12, and antioxidants to fuel your energy, strengthen immunity, and keep you at your best every single day.',
    '["https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80"]',
    true,
    true,
    (SELECT id FROM cat)
  )
ON CONFLICT (slug) DO NOTHING;
