import { getSiteConfig } from '@/lib/settings'

export default async function FoundersPreviewB() {
  const config = await getSiteConfig()

  const founders = [
    {
      name: config.founder1_name || 'Dr Alma Baby',
      title: config.founder1_title || 'Co-founder & Chief Medical Education Officer',
      bio: config.founder1_bio || 'The trusted medical voice of NeoFuture & Neobloom, dedicated to simplifying women\'s health through evidence-based education and compassionate communication.',
      image: config.founder1_image || '',
      accent: '#D4236A',
      bg: '#FFF0F5',
      initials: 'AB',
    },
    {
      name: config.founder2_name || 'Dr Sachin Vengat',
      title: config.founder2_title || 'Co-founder & Chief Executive Officer',
      bio: config.founder2_bio || 'With a vision to redefine the future of healthcare, leading NeoFuture at the intersection of medicine, technology, and innovation.',
      image: config.founder2_image || '',
      accent: '#7B35A8',
      bg: '#F5F0FF',
      initials: 'SV',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0F0F1A] py-20 px-4">
      <p className="text-center text-xs text-yellow-400 mb-12 bg-yellow-950 border border-yellow-800 rounded-lg py-2 max-w-sm mx-auto">
        Style B — Dark Glow Cards
      </p>

      {/* Header */}
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-3 block">Leadership</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white">Meet Our Founders</h2>
        <p className="text-gray-400 mt-4 text-sm max-w-md mx-auto">The minds and hearts behind NeoFuture's mission.</p>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        {founders.map((f, i) => {
          const showFallback = !f.image?.trim()
          return (
            <div
              key={i}
              className="rounded-3xl p-8 relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, #1a1a2e, #16213e)`,
                border: `1px solid ${f.accent}30`,
                boxShadow: `0 0 40px ${f.accent}15`,
              }}
            >
              {/* Glow blob */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: f.accent }}
              />

              {/* Photo */}
              <div className="mb-6">
                {showFallback ? (
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${f.accent}, ${f.accent}88)`,
                      boxShadow: `0 8px 24px ${f.accent}40`,
                    }}
                  >
                    {f.initials}
                  </div>
                ) : (
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                    style={{ boxShadow: `0 8px 24px ${f.accent}40` }}
                  />
                )}
              </div>

              {/* Name + title */}
              <h3 className="text-xl font-bold text-white mb-1">{f.name}</h3>
              <p className="text-sm font-semibold mb-5" style={{ color: f.accent }}>{f.title}</p>

              {/* Divider */}
              <div className="h-px mb-5" style={{ background: `linear-gradient(to right, ${f.accent}60, transparent)` }} />

              {/* Bio */}
              <p className="text-gray-400 text-sm leading-relaxed">{f.bio}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
