import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "NeoFuture — Women's Health & Wellness"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FBE8F2 0%, #F3E8FC 50%, #FEF3E7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#D4236A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: 'white', fontSize: 36, fontWeight: 700 }}>N</div>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#D4236A', letterSpacing: '-1px' }}>
            NeoFuture
          </div>
        </div>

        <div style={{ fontSize: 30, color: '#1A1535', fontWeight: 400, textAlign: 'center', marginBottom: '20px' }}>
          Women's Health &amp; Wellness
        </div>

        <div style={{
          fontSize: 20, color: '#6B7280', textAlign: 'center',
          maxWidth: 700, lineHeight: 1.5,
        }}>
          From trusted hands to quality lives — products, telemedicine &amp; tools for every stage of womanhood
        </div>

        <div style={{
          marginTop: 48, display: 'flex', gap: 24,
        }}>
          {['Shop', 'Consult a Doctor', 'NeoPulse Rewards', 'Wellness Tools'].map((tag) => (
            <div key={tag} style={{
              background: 'white', borderRadius: 50,
              padding: '8px 20px', fontSize: 16, color: '#D4236A',
              border: '1px solid #D4236A22',
            }}>
              {tag}
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute', bottom: 36, right: 60,
          fontSize: 18, color: '#D4236A80',
        }}>
          neofuture.in
        </div>
      </div>
    ),
    { ...size }
  )
}
