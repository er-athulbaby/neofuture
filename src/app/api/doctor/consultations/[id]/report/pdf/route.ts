import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { generatePrescriptionPDF } from '@/lib/consultation-pdf'
import { uploadToS3 } from '@/lib/s3'
import { sendConsultationReport } from '@/lib/email'

// POST /api/doctor/consultations/[id]/report/pdf
// Regenerates the PDF for an existing report (when pdf_url is null)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.is_doctor && !session.user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const doctor = await queryOne<{ id: number; name: string; qualification: string; specialisation: string; registration_no: string; state_medical_council: string; photo_url: string; signature_url: string }>(
    'SELECT id, name, qualification, specialisation, registration_no, state_medical_council, photo_url, signature_url FROM doctors WHERE user_id = $1',
    [session.user.id]
  )
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const consult = await queryOne<{ id: number; patient_id: number; slot_datetime: string }>(
    'SELECT id, patient_id, slot_datetime FROM consultations WHERE id=$1 AND doctor_id=$2',
    [id, doctor.id]
  )
  if (!consult) return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })

  const report = await queryOne<{ id: number; diagnosis: string; notes: string; prescription: string; additional_instructions: string; followup_weeks: number; followup_date: string }>(
    'SELECT id, diagnosis, notes, prescription, additional_instructions, followup_weeks, followup_date FROM consultation_reports WHERE consultation_id=$1',
    [id]
  )
  if (!report) return NextResponse.json({ error: 'Report not found — submit the report first' }, { status: 404 })

  const [patient, patientVitals] = await Promise.all([
    queryOne<{ name: string; email: string; phone: string }>(
      'SELECT name, email, phone FROM users WHERE id=$1',
      [consult.patient_id]
    ),
    queryOne<{ dob: string | null }>(
      'SELECT dob FROM doctor_patient_vitals WHERE doctor_id=$1 AND patient_id=$2::text',
      [doctor.id, consult.patient_id]
    ).catch(() => null),
  ])

  const prescription = typeof report.prescription === 'string' ? JSON.parse(report.prescription) : report.prescription

  const age = patientVitals?.dob ? Math.floor((Date.now() - new Date(patientVitals.dob).getTime()) / 31557600000) : 0
  const consultDate = new Date(consult.slot_datetime)
  const dateStr = consultDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = consultDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const pdfBuffer = await generatePrescriptionPDF({
    prescriptionId: `RX-${dateStr.replace(/ /g, '').slice(0, 8)}-${String(report.id).padStart(4, '0')}`,
    consultationId: `TC-${String(id).padStart(6, '0')}`,
    patientId: `P-${String(consult.patient_id).padStart(6, '0')}`,
    date: dateStr,
    time: timeStr,
    patient: { name: patient?.name ?? '', age, gender: 'Female', mobile: patient?.phone ?? '' },
    doctor: {
      name: doctor.name,
      qualification: doctor.qualification ?? '',
      specialisation: doctor.specialisation ?? '',
      registrationNo: doctor.registration_no ?? '',
      stateMedicalCouncil: doctor.state_medical_council ?? '',
      photoUrl: doctor.photo_url ?? undefined,
      signatureUrl: doctor.signature_url ?? undefined,
    },
    diagnosis: report.diagnosis,
    prescription,
    additionalInstructions: report.additional_instructions,
    followupWeeks: report.followup_weeks,
    followupDate: report.followup_date,
  })

  const s3Key = `prescriptions/${id}/report-${report.id}.pdf`
  const pdfUrl = await uploadToS3(pdfBuffer, s3Key, 'application/pdf')

  await query('UPDATE consultation_reports SET pdf_url=$1 WHERE id=$2', [pdfUrl, report.id])

  // Email patient
  if (patient?.email) {
    await sendConsultationReport(patient.email, {
      patientName: patient.name,
      doctorName: doctor.name,
      pdfBuffer,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, pdf_url: pdfUrl })
}
