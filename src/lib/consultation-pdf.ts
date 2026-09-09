import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

export interface PrescriptionData {
  prescriptionId: string
  consultationId: string
  patientId: string
  date: string
  time: string
  patient: {
    name: string
    age: number
    gender: string
    mobile: string
  }
  doctor: {
    name: string
    qualification: string
    specialisation: string
    registrationNo: string
    stateMedicalCouncil: string
    photoUrl?: string
    signatureUrl?: string
  }
  diagnosis: string
  prescription: Array<{
    medicine: string
    strength: string
    dosage_route: string
    frequency: string
    duration: string
    quantity: string
  }>
  additionalInstructions?: string
  followupWeeks?: number
  followupDate?: string
}

function formatFollowupDate(raw: string): string {
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return raw }
}

let _logoB64: string | null = null
function getLogoDataUri(): string {
  if (_logoB64) return _logoB64
  try {
    const filePath = path.join(process.cwd(), 'public', 'images', 'neo-logo.png')
    const buf = fs.readFileSync(filePath)
    _logoB64 = 'data:image/png;base64,' + buf.toString('base64')
    return _logoB64
  } catch {
    return ''
  }
}

export async function generatePrescriptionPDF(data: PrescriptionData): Promise<Buffer> {
  const verifyUrl = `https://neofuture.in/verify/${data.prescriptionId}`
  const qrDataUri = await QRCode.toDataURL(verifyUrl, { width: 72, margin: 1 })
  const logoDataUri = getLogoDataUri()

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  })

  try {
    const page = await browser.newPage()
    const html = buildPrescriptionHtml(data, logoDataUri, qrDataUri)
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

function buildPrescriptionHtml(d: PrescriptionData, logoDataUri: string, qrDataUri: string): string {
  const rows = d.prescription.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff7ed' : '#fff'}">
      <td style="padding:8px;border:1px solid #fed7aa;text-align:center">${i + 1}</td>
      <td style="padding:8px;border:1px solid #fed7aa;font-weight:600">${p.medicine}</td>
      <td style="padding:8px;border:1px solid #fed7aa">${p.strength}</td>
      <td style="padding:8px;border:1px solid #fed7aa">${p.dosage_route}</td>
      <td style="padding:8px;border:1px solid #fed7aa">${p.frequency}</td>
      <td style="padding:8px;border:1px solid #fed7aa">${p.duration}</td>
      <td style="padding:8px;border:1px solid #fed7aa">${p.quantity}</td>
    </tr>`).join('')

  const instructions = d.additionalInstructions
    ? d.additionalInstructions.split('\n').filter(Boolean).map(l => `<li>${l}</li>`).join('')
    : ''

  const followupDateStr = d.followupDate ? formatFollowupDate(d.followupDate) : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1535; background: #fff; }
  .header { background: #fff; color: #1a1535; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #fa4505; }
  .date-box { background: #fff7ed; border-radius: 6px; padding: 8px 14px; text-align: right; font-size: 12px; white-space: nowrap; color: #1a1535; }
  .ids-row { display: flex; gap: 0; border: 1px solid #e5e7eb; margin: 0 0 12px; }
  .id-cell { flex: 1; padding: 10px 14px; border-right: 1px solid #e5e7eb; }
  .id-cell:last-child { border-right: none; }
  .id-cell .label { font-size: 10px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .id-cell .value { font-size: 13px; font-weight: 700; color: #fa4505; margin-top: 2px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fa4505; border-bottom: 2px solid #fed7aa; padding-bottom: 4px; margin-bottom: 10px; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .field .label { font-size: 10px; color: #9ca3af; }
  .field .value { font-size: 13px; font-weight: 600; color: #1a1535; }
  .doctor-info h3 { font-size: 15px; font-weight: 700; color: #1a1535; }
  .doctor-info p { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doctor-reg { margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .reg-item .label { font-size: 10px; color: #9ca3af; }
  .reg-item .value { font-size: 12px; font-weight: 600; }
  .diagnosis-box { background: #fff7ed; border-left: 4px solid #fa4505; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: #fa4505; color: #fff; }
  thead th { padding: 10px 8px; text-align: left; font-weight: 600; border: 1px solid #d94104; }
  .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
  .followup-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; }
  .followup-box h4 { font-size: 11px; font-weight: 700; color: #fa4505; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .important-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; }
  .important-box h4 { font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .important-box p { font-size: 11px; color: #9f1239; line-height: 1.5; }
  .sig-row { display: flex; align-items: flex-end; gap: 24px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
  .sig-block { flex: 1; }
  .sig-img { max-height: 50px; max-width: 150px; }
  .sig-name { font-size: 12px; font-weight: 700; margin-top: 4px; }
  .sig-sub { font-size: 10px; color: #6b7280; }
  .footer { background: #fa4505; color: rgba(255,255,255,0.9); padding: 10px 24px; font-size: 10px; margin-top: 16px; border-radius: 0 0 8px 8px; text-align: center; line-height: 1.6; }
</style>
</head>
<body>
<div style="padding:0;max-width:794px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoDataUri ? `<img src="${logoDataUri}" style="height:44px;object-fit:contain;" alt="NeoFuture"/>` : `<span style="font-size:20px;font-weight:900;letter-spacing:-1px;">neo<span style="color:#fda4af">future</span></span>`}
      <div style="border-left:2px solid #fa4505;padding-left:12px;">
        <div style="font-size:14px;font-weight:800;letter-spacing:0.5px;color:#1a1535;">PRESCRIPTION / MEDICATION SLIP</div>
        <div style="font-size:10px;color:#fa4505;letter-spacing:1.5px;margin-top:1px;">TELECONSULTATION · NEOFUTURE WELLNESS</div>
      </div>
    </div>
    <div class="date-box">
      <div style="font-size:10px;color:#6b7280;">Date &amp; Time</div>
      <div style="font-weight:700;color:#1a1535;">${d.date}, ${d.time}</div>
    </div>
  </div>

  <div style="padding:16px 20px;">

    <!-- IDs (no Patient ID) -->
    <div class="ids-row">
      <div class="id-cell"><div class="label">Prescription ID</div><div class="value">${d.prescriptionId}</div></div>
      <div class="id-cell"><div class="label">Consultation ID</div><div class="value">${d.consultationId}</div></div>
    </div>

    <!-- Patient -->
    <div class="section">
      <div class="section-title">Patient Details</div>
      <div class="patient-grid">
        <div class="field"><div class="label">Name</div><div class="value">${d.patient.name}</div></div>
        <div class="field"><div class="label">Age / Gender</div><div class="value">${d.patient.age} Years / ${d.patient.gender}</div></div>
        <div class="field"><div class="label">Mobile</div><div class="value">${d.patient.mobile || '—'}</div></div>
      </div>
    </div>

    <!-- Doctor (no photo) -->
    <div class="section">
      <div class="section-title">Doctor Details (Prescribing RMP)</div>
      <div class="doctor-info">
        <h3>${d.doctor.name}</h3>
        <p>${d.doctor.qualification} · ${d.doctor.specialisation}</p>
        <div class="doctor-reg">
          <div class="reg-item"><div class="label">Medical Registration No.</div><div class="value">${d.doctor.registrationNo || '—'}</div></div>
        </div>
      </div>
    </div>

    <!-- Diagnosis -->
    <div class="section">
      <div class="section-title">Diagnosis / Clinical Assessment</div>
      <div class="diagnosis-box">${d.diagnosis}</div>
    </div>

    <!-- Prescription table -->
    <div class="section">
      <div class="section-title">Prescription</div>
      <table>
        <thead>
          <tr>
            <th>No.</th><th>Medicine (Generic Name)</th><th>Strength</th>
            <th>Dosage &amp; Route</th><th>Frequency</th><th>Duration</th><th>Quantity</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    ${instructions ? `
    <div class="section">
      <div class="section-title">Additional Instructions / Advice</div>
      <ul style="padding-left:18px;color:#374151;line-height:1.8;font-size:12px">${instructions}</ul>
    </div>` : ''}

    <!-- Bottom grid -->
    <div class="bottom-grid">
      <div class="followup-box">
        <h4>Follow-Up</h4>
        ${followupDateStr ? `<p style="font-size:12px">Follow-up Date: <strong>${followupDateStr}</strong></p>` : '<p style="font-size:12px;color:#6b7280">As advised by doctor</p>'}
      </div>
      <div class="important-box">
        <h4>⚠ Important</h4>
        <p>This prescription is issued based on the teleconsultation. Use medicines only as directed. In case of emergency or worsening of symptoms, seek immediate medical care.</p>
      </div>
    </div>

    <!-- Signature + QR -->
    <div class="sig-row">
      <div class="sig-block">
        <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Doctor's Digital Signature</div>
        ${d.doctor.signatureUrl
          ? `<img src="${d.doctor.signatureUrl}" class="sig-img" alt="Signature"/>`
          : `<div style="width:120px;height:40px;border-bottom:2px solid #1a1535;margin-bottom:4px;"></div>`}
        <div class="sig-name">${d.doctor.name}</div>
        <div class="sig-sub">${d.date}, ${d.time}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Scan to Verify</div>
        ${qrDataUri ? `<img src="${qrDataUri}" style="width:72px;height:72px;" alt="QR"/>` : ''}
        <div style="font-size:9px;color:#9ca3af;margin-top:4px;">neofuture.in/verify</div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    This is an electronic prescription generated and digitally signed by the Registered Medical Practitioner.
    This is not a medical emergency document. Not valid for medico-legal purpose.
  </div>

</div>
</body>
</html>`
}
