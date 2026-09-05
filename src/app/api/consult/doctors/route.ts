import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const doctors = await query(`
    SELECT id, name, photo_url, qualification, specialisation, bio, consultation_fee
    FROM doctors WHERE is_active = true ORDER BY id
  `)
  return NextResponse.json(doctors)
}
