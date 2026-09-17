import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const SETTING_KEYS = [
  'pcos_price', 'pcos_original_price',
  'pcos_slide_title', 'pcos_slide_subtitle',
  'pcos_detail_title', 'pcos_detail_description', 'pcos_features',
]

async function ensureSettingsRows() {
  const defaults: Record<string, string> = {
    pcos_price: '899',
    pcos_original_price: '1200',
    pcos_slide_title: '90 Days PCOS/PCOD Reset Journey',
    pcos_slide_subtitle: "We're here. We're listening. We're with you. Your journey to better hormonal health starts today.",
    pcos_detail_title: '90 Days. One Journey. You\'re Not Alone.',
    pcos_detail_description: 'Understand your body. Track your progress. Get the right guidance with doctor-backed care and AI-powered insights. We\'re with you—every step of the way.',
    pcos_features: JSON.stringify([
      'Initial doctor consultation',
      'Personal PCOS/wellness assessment',
      'Doctor-led live sessions',
      'Private PCOS Community with Doctors',
      'Dietary & lifestyle guidance',
      'Personalized insights',
      'Daily wellness check-ins with NeoTwin',
      'Progress tracking & rewards',
    ]),
  }
  for (const [k, v] of Object.entries(defaults)) {
    await query(
      `INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`,
      [k, v]
    ).catch(() => {})
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await ensureSettingsRows()

  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM site_settings WHERE key = ANY($1)`,
    [SETTING_KEYS]
  )
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))

  const enrollments = await query(
    `SELECT id, name, email, phone, amount_paid, status, razorpay_payment_id, enrolled_at
     FROM pcos_enrollments ORDER BY enrolled_at DESC`
  ).catch(() => [])

  return NextResponse.json({ settings, enrollments })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  for (const key of SETTING_KEYS) {
    if (body[key] !== undefined) {
      await query(
        `INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`,
        [key, String(body[key])]
      )
    }
  }
  return NextResponse.json({ ok: true })
}

// Public endpoint to read program settings (for the detail page)
export async function POST() {
  await ensureSettingsRows()
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM site_settings WHERE key = ANY($1)`,
    [SETTING_KEYS]
  )
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
}
