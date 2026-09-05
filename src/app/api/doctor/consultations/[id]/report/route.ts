import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { generatePrescriptionPDF } from '@/lib/consultation-pdf'
import { uploadToS3 } from '@/lib/s3'
import { sendConsultationReport } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const doctor = await queryOne<{ id: number; name: string; qualification: string; specialisation: string; registration_no: string; state_medical_council: string; photo_url: string; signature_url: string }>(
    'SELECT id, name, qualification, specialisation, registration_no, state_medical_council, photo_url, signature_url FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

  const consult = await queryOne<{ id: number; patient_id: number; slot_datetime: string; doctor_id: number }>(
    'SELECT id, patient_id, slot_datetime, doctor_id FROM consultations WHERE id=$1 AND doctor_id=$2',
    [id, doctor.id]
  )
  if (!consult) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patient = await queryOne<{ name: string; email: string; phone: string; dob: string; gender: string }>(
    'SELECT name, email, phone, dob, gender FROM users WHERE id=$1',
    [consult.patient_id]
  )

  const { diagnosis, notes, prescription, additional_instructions, followup_weeks, followup_date } = await req.json()

  // Snapshot wellness scores
  const [latestScore, recentCheckins] = await Promise.all([
    queryOne('SELECT hormone_score, stress_score, energy_score FROM wellness_scores WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1', [consult.patient_id]).catch(() => null),
    query('SELECT check_in_date, wellness_score, energy_score, stress_level, sleep_score FROM wellness_checkins WHERE user_id=$1 ORDER BY check_in_date DESC LIMIT 7', [consult.patient_id]).catch(() => []),
  ])

  const wellnessSnapshot = { latestScore, recentCheckins }

  // Save report
  const report = await queryOne<{ id: number }>(
    `INSERT INTO consultation_reports (consultation_id, diagnosis, notes, prescription, additional_instructions, followup_weeks, followup_date, wellness_snapshot)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [id, diagnosis, notes, JSON.stringify(prescription), additional_instructions, followup_weeks ?? null, followup_date ?? null, JSON.stringify(wellnessSnapshot)]
  )

  // Compute age
  const age = patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : 0
  const consultDate = new Date(consult.slot_datetime)
  const dateStr = consultDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = consultDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // Generate PDF
  const pdfBuffer = await generatePrescriptionPDF({
    prescriptionId: `RX-${dateStr.replace(/ /g, '').slice(0, 8)}-${String(report!.id).padStart(4, '0')}`,
    consultationId: `TC-${String(id).padStart(6, '0')}`,
    patientId: `P-${String(consult.patient_id).padStart(6, '0')}`,
    date: dateStr,
    time: timeStr,
    patient: { name: patient?.name ?? '', age, gender: (patient as { gender?: string })?.gender ?? 'Female', mobile: patient?.phone ?? '' },
    doctor: {
      name: doctor.name,
      qualification: doctor.qualification ?? '',
      specialisation: doctor.specialisation ?? '',
      registrationNo: doctor.registration_no ?? '',
      stateMedicalCouncil: doctor.state_medical_council ?? '',
      photoUrl: doctor.photo_url ?? undefined,
      signatureUrl: doctor.signature_url ?? undefined,
    },
    diagnosis,
    prescription,
    additionalInstructions: additional_instructions,
    followupWeeks: followup_weeks,
    followupDate: followup_date,
  })

  // Upload to S3
  const s3Key = `prescriptions/${id}/report-${report!.id}.pdf`
  const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf')

  // Update report with pdf_url
  await query('UPDATE consultation_reports SET pdf_url=$1 WHERE id=$2', [pdfUrl, report!.id])

  // Mark consultation completed and set followup window
  await query(
    `UPDATE consultations SET status='completed', followup_expires_at=NOW() + INTERVAL '7 days' WHERE id=$1`,
    [id]
  )

  // Email patient with PDF
  if (patient?.email) {
    await sendConsultationReport(patient.email, {
      patientName: patient.name,
      doctorName: doctor.name,
      pdfBuffer,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, pdf_url: pdfUrl })
}
