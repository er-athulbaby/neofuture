import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

const KEYS = ['pcos_price','pcos_original_price','pcos_slide_title','pcos_slide_subtitle','pcos_detail_title','pcos_detail_description','pcos_features']

const DEFAULTS: Record<string, string> = {
  pcos_price: '899',
  pcos_original_price: '1200',
  pcos_slide_title: '90 Days PCOS/PCOD Reset Journey',
  pcos_slide_subtitle: "We're here. We're listening. We're with you. Your journey to better hormonal health starts today.",
  pcos_detail_title: "90 Days. One Journey. You're Not Alone.",
  pcos_detail_description: "Understand your body. Track your progress. Get the right guidance with doctor-backed care and AI-powered insights. We're with you—every step of the way.",
  pcos_features: JSON.stringify(['Initial doctor consultation','Personal PCOS/wellness assessment','Doctor-led live sessions','Private PCOS Community with Doctors','Dietary & lifestyle guidance','Personalized insights','Daily wellness check-ins with NeoTwin','Progress tracking & rewards']),
}

export async function GET() {
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM site_settings WHERE key = ANY($1)`, [KEYS]
  ).catch(() => [] as { key: string; value: string }[])
  const data = { ...DEFAULTS, ...Object.fromEntries(rows.map(r => [r.key, r.value])) }
  return NextResponse.json(data)
}
