import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, whatsapp, email, quiz_session_id, recommended_product, quiz_path, hormone_score, stress_score, energy_score } = body

    if (!name || !whatsapp) {
      return NextResponse.json({ error: 'Name and WhatsApp are required' }, { status: 400 })
    }

    await query(
      `INSERT INTO wellness_leads
        (name, whatsapp, email, quiz_session_id, recommended_product, quiz_path, hormone_score, stress_score, energy_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [name, whatsapp, email ?? null, quiz_session_id ?? null, recommended_product, quiz_path, hormone_score ?? 0, stress_score ?? 0, energy_score ?? 0]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lead capture error:', err)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}
