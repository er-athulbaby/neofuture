// Run: node scripts/seed-products.mjs
// Requires DATABASE_URL in .env.local

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const sql = readFileSync(path.join(__dirname, '..', 'sql', 'seed-products.sql'), 'utf8')

try {
  await pool.query(sql)
  console.log('✅ Products seeded successfully!')

  const { rows } = await pool.query('SELECT id, name, sale_price, price FROM products ORDER BY id')
  console.log('\nProducts in database:')
  rows.forEach(p => console.log(`  [${p.id}] ${p.name} — ₹${p.sale_price ?? p.price}`))
} catch (err) {
  console.error('❌ Seed failed:', err.message)
} finally {
  await pool.end()
}
