import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

interface ReportRow {
  id: number
  diagnosis: string
  created_at: string
  doctor_name: string
  qualification: string
  specialisation: string
  patient_name: string
  consultation_id: number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // id is the prescription ID like RX-08Septem-0001; extract numeric report id from last segment
  const parts = id.split('-')
  const reportNum = parseInt(parts[parts.length - 1], 10)
  if (isNaN(reportNum) || reportNum < 1) {
    return NextResponse.json({ valid: false }, { status: 404 })
  }

  const row = await queryOne<ReportRow>(`
    SELECT cr.id, cr.diagnosis, cr.created_at,
           d.name AS doctor_name, d.qualification, d.specialisation,
           u.name AS patient_name, cr.consultation_id
    FROM consultation_reports cr
    JOIN consultations c ON c.id = cr.consultation_id
    JOIN doctors d ON d.id = c.doctor_id
    JOIN users u ON u.id::text = c.patient_id::text
    WHERE cr.id = $1
  `, [reportNum])

  if (!row) return NextResponse.json({ valid: false }, { status: 404 })

  return NextResponse.json({
    valid: true,
    prescriptionId: id,
    consultationId: `TC-${String(row.consultation_id).padStart(6, '0')}`,
    date: new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    doctor: `Dr. ${row.doctor_name}`,
    qualification: row.qualification,
    specialisation: row.specialisation,
    patient: row.patient_name,
    diagnosis: row.diagnosis,
  })
}
