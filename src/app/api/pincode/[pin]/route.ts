import { NextRequest, NextResponse } from 'next/server'

interface Props { params: Promise<{ pin: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { pin } = await params

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: { 'User-Agent': 'NeoFuture/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()

    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
      const po = data[0].PostOffice[0]
      return NextResponse.json({
        city: po.District || po.Name,
        state: po.State,
        country: 'India',
      })
    }
    return NextResponse.json({ error: 'Pincode not found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
