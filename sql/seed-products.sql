-- NeoFuture Product Seed Data
-- Run: psql $DATABASE_URL -f sql/seed-products.sql
-- Safe to re-run (ON CONFLICT DO NOTHING)

INSERT INTO products (
  name, slug, short_description, description, price, sale_price,
  images, category_id, stock, is_featured, is_active, sku,
  ingredients, how_to_use, tags
) VALUES

-- 1. Menstrual Cup
(
  'Menstrual Cup',
  'menstrual-cup',
  'Eco-friendly medical grade silicone menstrual cup for comfortable, leak-free period protection.',
  'Say goodbye to disposable pads and tampons. Our medical-grade silicone menstrual cup is soft, flexible, and designed for all-day comfort. Reusable for up to 10 years, it holds 3× more than a regular tampon and is hypoallergenic. Available in XS, S, and L sizes — and in Purple or Pink.

Key Features:
• Medical-grade silicone — ISO13485 / FDA / CE certified
• Available sizes: XS (light flow / teens), S (regular flow), L (heavy flow / post-childbirth)
• Available colours: Purple, Pink
• Holds up to 25 ml — no leaks for up to 12 hours
• Easy to insert, remove, and clean
• Eco-friendly: replaces thousands of disposable products
• Certifications: ISO13485, ISO9001, REACH, SEDEX, RoHS, FDA, CE',
  665.00, 449.00,
  '["https://neofuture.in/wp-content/uploads/2025/12/Menstrual_Cup.jpg","https://neofuture.in/wp-content/uploads/2025/12/Menstrual_Cup_1.jpg","https://neofuture.in/wp-content/uploads/2025/12/Menstrual_Cup_2.jpg","https://neofuture.in/wp-content/uploads/2025/12/Menstrual_Cup_3.jpg"]',
  2, 50, true, true, 'NF-MC-001',
  'Medical-grade silicone',
  '1. Wash hands thoroughly. 2. Fold the cup using the C-fold or punch-down fold. 3. Insert into the vagina and let it open fully. 4. Wear for up to 12 hours. 5. Remove, empty, rinse with water, and reinsert. 6. At the end of your cycle, boil for 5 minutes to sterilize.',
  '["menstrual cup","period care","reusable","eco-friendly","silicone","feminine hygiene"]'
),

-- 2. Touch Panel Menstrual Cup Sterilizer
(
  'Touch Panel Menstrual Cup Sterilizer',
  'touch-panel-sterilizer',
  'Electronic UV + steam sterilizer with touch controls — kills 99.9% of bacteria for a hygienic menstrual cup every time.',
  'Keep your menstrual cup perfectly clean with this advanced touch-panel sterilizer. Combines UV light and steam sterilization to eliminate 99.9% of bacteria and pathogens in minutes — no boiling required.

Key Features:
• Smart touch-panel control with LED indicator
• UV + steam dual sterilization
• Auto shut-off after cycle completes
• Compact and portable design
• Safe for medical-grade silicone cups
• BPA-free materials
• 360° sterilization coverage
• Certifications: CE, RoHS',
  2655.00, 2299.00,
  '["https://neofuture.in/wp-content/uploads/2025/12/sterilizer-front.jpg"]',
  2, 30, true, true, 'NF-ST-001',
  'ABS plastic body, UV-C LED, stainless steel interior',
  '1. Fill the water reservoir to the fill line. 2. Place your menstrual cup inside. 3. Close the lid and press the power button. 4. The cycle completes in 5–8 minutes. 5. Remove cup with clean hands once the indicator light turns green.',
  '["sterilizer","menstrual cup","UV sterilizer","period care","hygiene"]'
),

-- 3. Menstrual Cup and Touch Panel Sterilizer – Combo
(
  'Menstrual Cup + Sterilizer Combo',
  'menstrual-cup-sterilizer-combo',
  'Complete period care combo — medical-grade menstrual cup with touch-panel sterilizer for zero-hassle hygiene.',
  'Get the best of both worlds in one money-saving combo. Includes our eco-friendly medical-grade silicone menstrual cup (choice of XS, S, or L) and the smart touch-panel UV + steam sterilizer. Everything you need for safe, sustainable, and hygienic period care.

What''s Included:
• 1× NeoFuture Menstrual Cup (your choice of size and colour)
• 1× Touch Panel Menstrual Cup Sterilizer
• Storage pouch

Why Choose the Combo?
• Save ₹711 vs buying separately
• Perfect starter kit for switching to reusable period care
• Certifications: ISO13485, FDA, CE, RoHS',
  3310.00, 2599.00,
  '["https://neofuture.in/wp-content/uploads/2025/12/mescombo-front.jpg"]',
  2, 20, true, true, 'NF-COMBO-001',
  'Medical-grade silicone cup + ABS sterilizer with UV-C LED',
  'See individual products — Menstrual Cup and Touch Panel Sterilizer — for detailed usage instructions included in the combo pack.',
  '["combo","menstrual cup","sterilizer","period care","bundle","eco-friendly"]'
),

-- 4. Menstrual Pain Relief Heat Patch (5 Patches)
(
  'Menstrual Pain Relief Heat Patch (5 Patches)',
  'menstrual-heat-patch',
  'Air-activated self-heating patches for instant menstrual cramp relief — stays warm for up to 12 hours.',
  'Get fast, drug-free relief from period pain with these air-activated heat therapy patches. Just peel and stick — they start warming within minutes and stay at a soothing 50°C for 10–12 hours. Discreet enough to wear under clothing.

Key Features:
• Heat duration: 10–12 hours continuous warmth
• Average temperature: ~50°C (gentle and safe)
• Size: 211 × 93.1 mm — covers the entire lower abdomen
• Air-activated — no microwave or battery needed
• Ultra-thin and flexible — wears invisibly under clothes
• Drug-free pain relief
• Pack of 5 patches
• Brand: TheMoreCare
• Certifications: CE (MDR), ISO13485, BSCI, MSDS',
  890.00, 499.00,
  '["https://neofuture.in/wp-content/uploads/2025/12/heating_patch_1.jpg","https://neofuture.in/wp-content/uploads/2025/12/heating_patch_2.jpg","https://neofuture.in/wp-content/uploads/2025/12/heating_patch.jpg","https://neofuture.in/wp-content/uploads/2025/12/Heating_patch_4.jpg"]',
  2, 100, true, true, 'NF-HP-001',
  'Iron powder, activated carbon, salt, water, vermiculite',
  '1. Tear open the outer packaging to activate the patch. 2. Wait 1–2 minutes for it to begin warming. 3. Peel off the backing and stick to the outside of underwear or clothing over the lower abdomen. 4. Do not apply directly to skin. 5. Discard after use.',
  '["heat patch","menstrual pain","cramp relief","period care","heat therapy","pain relief"]'
),

-- 5. Pregnancy Support Belt
(
  'Pregnancy Support Belt',
  'pregnancy-support-belt',
  'Gentle abdominal support belt that relieves back and belly strain during pregnancy — free size, all-day comfort.',
  'Designed for expectant mothers, this maternity support belt provides gentle, adjustable compression to relieve lower back pain, round ligament pain, and the discomfort of a growing bump. Breathable polyamide fabric keeps you cool and comfortable throughout the day.

Key Features:
• Provides back, pelvis, and belly support
• Free size — adjustable velcro strap fits most body types
• Soft, breathable polyamide + combined fabric construction
• Lightweight abdominal girdle style
• Suitable from second trimester onwards
• Machine washable
• Colour: Beige
• Model: Abdominal Girdle 01
• Protection Class: Basic',
  1480.00, 999.00,
  '["https://neofuture.in/wp-content/uploads/2025/12/Maternity_belt.jpg","https://neofuture.in/wp-content/uploads/2025/12/maternity_belt_5.jpg","https://neofuture.in/wp-content/uploads/2025/12/maternity_belt_4.jpg","https://neofuture.in/wp-content/uploads/2025/12/maternity_belt_3.jpg","https://neofuture.in/wp-content/uploads/2025/12/maternity_belt_2.jpg","https://neofuture.in/wp-content/uploads/2025/12/maternity_belt_1.jpg"]',
  3, 25, true, true, 'NF-PSB-001',
  'Polyamide, combined support fabric, velcro closure',
  '1. Step into the belt or wrap around your lower abdomen. 2. Position the centre panel beneath the belly bump. 3. Fasten the velcro straps for a snug but comfortable fit. 4. Wear for up to 4–6 hours at a time. 5. Remove while lying down or sleeping.',
  '["pregnancy","maternity belt","support belt","back pain","pregnancy care","abdominal support"]'
)

ON CONFLICT (slug) DO NOTHING;
