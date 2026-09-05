import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(`
    SELECT c.*,
      d.name AS doctor_name, d.specialisation, d.photo_url AS doctor_photo, d.qualification,
      d.registration_no, d.consultation_fee,
      r.id AS report_id, r.diagnosis, r.prescription, r.pdf_url, r.created_at AS report_date
    FROM consultations c
    JOIN doctors d ON d.id = c.doctor_id
    LEFT JOIN consultation_reports r ON r.consultation_id = c.id
    WHERE c.patient_id = $1
    ORDER BY c.slot_datetime DESC
  `, [session.user.id])

  return NextResponse.json(rows)
}
