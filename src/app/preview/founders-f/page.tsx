import { getSiteConfig } from '@/lib/settings'

export default async function FoundersPreviewF() {
  const config = await getSiteConfig()

  const founders = [
    {
      name: config.founder1_name || 'Dr Alma Baby',
      title: config.founder1_title || 'Co-founder & CMEO',
      bio: config.founder1_bio || 'The trusted medical voice of NeoFuture & Neobloom, dedicated to simplifying women\'s health through evidence-based education and compassionate communication.',
      image: config.founder1_image || '',
      accent: '#D4236A',
    },
    {
      name: config.founder2_name || 'Dr Sachin Vengat',
      title: config.founder2_title || 'Co-founder & CEO',
      bio: config.founder2_bio || 'With a vision to redefine the future of healthcare, leading NeoFuture at the intersection of medicine, technology, and innovation.',
      image: config.founder2_image || '',
      accent: '#7B35A8',
    },
  ]

  return (
    <div className="min-h-screen py-20 px-4" style={{ background: 'linear-gradient(160deg, #fff5f9 0%, #faf5ff 50%, #fff5f9 100%)' }}>
      <p className="text-center text-xs text-yellow-700 mb-12 bg-yellow-50 border border-yellow-200 rounded-lg py-2 max-w-sm mx-auto">
        Style F — Centered Circles (Portrait)
      </p>

      {/* Header */}
      <div className="text-center mb-16">
        <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 border"
          style={{ color: '#D4236A', borderColor: '#D4236A40', background: '#D4236A0A' }}>
          Leadership
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
          The Faces Behind <br />
          <span style={{ color: '#D4236A' }}>NeoFuture</span>
        </h2>
      </div>

      {/* 2-col centered portrait cards */}
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-10">
        {founders.map((f, i) => {
          const showFallback = !f.image?.trim()
          const initials = f.name.split(' ').map((w) => w[0]).join('').slice(0, 2)

          return (
            <div key={i} className="text-center group">
              {/* Circle photo */}
              <div className="relative mx-auto w-fit mb-6">
                {/* Outer ring */}
                <div
                  className="absolute inset-0 rounded-full scale-110 opacity-20 group-hover:opacity-40 transition-opacity blur-sm"
                  style={{ background: f.accent }}
                />
                {showFallback ? (
                  <div
                    className="relative w-40 h-40 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${f.accent}, ${f.accent}aa)`,
                      boxShadow: `0 12px 32px ${f.accent}35`,
                    }}
                  >
                    {initials}
                  </div>
                ) : (
                  <img
                    src={f.image}
                    alt={f.name}
                    className="relative w-40 h-40 rounded-full object-cover"
                    style={{ boxShadow: `0 12px 32px ${f.accent}35` }}
                  />
                )}
                {/* Accent dot */}
                <div
                  className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white"
                  style={{ backgroundColor: f.accent }}
                />
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{f.name}</h3>

              {/* Title badge */}
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
                style={{ background: `${f.accent}15`, color: f.accent }}
              >
                {f.title}
              </span>

              {/* Bio */}
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{f.bio}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
