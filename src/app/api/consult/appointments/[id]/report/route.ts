import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { getPresignedUrl } from '@/lib/s3'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const report = await queryOne(`
    SELECT r.*, c.patient_id FROM consultation_reports r
    JOIN consultations c ON c.id = r.consultation_id
    WHERE r.consultation_id = $1
  `, [id])

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = report as { patient_id: number; pdf_url: string | null }
  if (String(r.patient_id) !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let downloadUrl: string | null = null
  if (r.pdf_url) {
    const key = r.pdf_url.includes('amazonaws.com') ? r.pdf_url.split('.amazonaws.com/')[1] : r.pdf_url
    downloadUrl = await getPresignedUrl(key, 3600)
  }

  return NextResponse.json({ ...report, download_url: downloadUrl })
}
