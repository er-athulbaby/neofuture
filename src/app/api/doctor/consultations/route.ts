import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doctor = await queryOne<{ id: number }>(
    'SELECT id FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

  const rows = await query(`
    SELECT c.*,
      u.name AS patient_name, u.email AS patient_email,
      r.id AS report_id
    FROM consultations c
    JOIN users u ON u.id = c.patient_id
    LEFT JOIN consultation_reports r ON r.consultation_id = c.id
    WHERE c.doctor_id = $1 AND c.status IN ('confirmed','completed')
    ORDER BY c.slot_datetime ASC
  `, [doctor.id])

  return NextResponse.json(rows)
}
