import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const d = new Date(date)
  const dayOfWeek = d.getDay()

  const avail = await queryOne<{ start_time: string; end_time: string; slot_duration: number }>(
    'SELECT start_time, end_time, slot_duration FROM doctor_availability WHERE doctor_id = $1 AND day_of_week = $2',
    [id, dayOfWeek]
  )

  if (!avail) return NextResponse.json([])

  // Get already booked slots for this date (compare in IST)
  const booked = await query<{ slot_datetime: string }>(
    `SELECT slot_datetime FROM consultations
     WHERE doctor_id = $1 AND DATE(slot_datetime AT TIME ZONE 'Asia/Kolkata') = $2 AND status IN ('pending','confirmed')`,
    [id, date]
  )
  const bookedTimes = new Set(booked.map(b => new Date(b.slot_datetime).toISOString()))

  // Generate slots with correct IST times (stored as UTC in DB)
  const slots: { datetime: string; available: boolean }[] = []
  const [sh, sm] = avail.start_time.split(':').map(Number)
  const [eh, em] = avail.end_time.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const duration = avail.slot_duration

  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const h = Math.floor(m / 60)
    const min = m % 60
    // Construct as IST (+05:30) so JS converts to correct UTC
    const iso = new Date(`${date}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+05:30`).toISOString()
    slots.push({ datetime: iso, available: !bookedTimes.has(iso) && new Date(iso) > new Date() })
  }

  return NextResponse.json(slots)
}
