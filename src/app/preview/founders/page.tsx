import { getSiteConfig } from '@/lib/settings'

export default async function FoundersPreview() {
  const config = await getSiteConfig()

  const founders = [
    {
      name: config.founder1_name || 'Dr Alma Baby',
      title: config.founder1_title || 'Co-founder & Chief Medical Education Officer (CMEO)',
      bio: config.founder1_bio || 'The trusted medical voice of NeoFuture & Neobloom, dedicated to simplifying women\'s health through evidence-based education and compassionate communication.',
      image: config.founder1_image || '',
      accent: '#D4236A',
      side: 'left' as const,
    },
    {
      name: config.founder2_name || 'Dr Sachin Vengat',
      title: config.founder2_title || 'Co-founder & Chief Executive Officer (CEO)',
      bio: config.founder2_bio || 'With a vision to redefine the future of healthcare, leading NeoFuture at the intersection of medicine, technology, and innovation.',
      image: config.founder2_image || '',
      accent: '#7B35A8',
      side: 'right' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-brand-light py-20 px-4">
      <p className="text-center text-xs text-brand-gray mb-12 bg-yellow-50 border border-yellow-200 rounded-lg py-2 max-w-sm mx-auto">
        Preview only — not live yet
      </p>

      {/* Section header */}
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Leadership</span>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark">Meet Our Founders</h2>
      </div>

      {/* Timeline layout */}
      <div className="max-w-4xl mx-auto relative">

        {/* Center vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/40 to-neo-purple/20 -translate-x-1/2 hidden md:block" />

        <div className="space-y-16">
          {founders.map((founder, i) => {
            const isLeft = founder.side === 'left'
            const initials = founder.name.split(' ').map((w) => w[0]).join('').slice(0, 2)

            return (
              <div key={i} className="relative">

                {/* Center dot on the line */}
                <div
                  className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10"
                  style={{ backgroundColor: founder.accent }}
                />

                {/* Horizontal connector */}
                <div
                  className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px w-12 z-0`}
                  style={{
                    background: founder.accent,
                    left: isLeft ? 'calc(50% - 64px)' : 'calc(50% + 8px)',
                  }}
                />

                {/* Card — sits on the correct side */}
                <div className={`md:w-[46%] ${isLeft ? 'md:mr-auto' : 'md:ml-auto'}`}>
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 hover:shadow-md transition-shadow">

                    {/* Top row: photo + name */}
                    <div className="flex items-center gap-4 mb-5">
                      {/* Photo */}
                      {founder.image ? (
                        <img
                          src={founder.image}
                          alt={founder.name}
                          className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow"
                          style={{ boxShadow: `0 4px 14px ${founder.accent}30` }}
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow"
                          style={{
                            background: `linear-gradient(135deg, ${founder.accent}, ${founder.accent}99)`,
                            boxShadow: `0 4px 14px ${founder.accent}40`,
                          }}
                        >
                          {initials}
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-bold text-brand-dark leading-tight">{founder.name}</h3>
                        <p className="text-xs font-semibold mt-1" style={{ color: founder.accent }}>
                          {founder.title}
                        </p>
                      </div>
                    </div>

                    {/* Decorative accent line */}
                    <div className="h-0.5 w-12 rounded-full mb-4" style={{ backgroundColor: founder.accent }} />

                    {/* Bio */}
                    <p className="text-brand-gray text-sm leading-relaxed">{founder.bio}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
