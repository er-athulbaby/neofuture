import { getSiteConfig } from '@/lib/settings'

export default async function FoundersPreviewE() {
  const config = await getSiteConfig()

  const founders = [
    {
      name: config.founder1_name || 'Dr Alma Baby',
      title: config.founder1_title || 'Co-founder & Chief Medical Education Officer',
      bio: config.founder1_bio || 'The trusted medical voice of NeoFuture & Neobloom, dedicated to simplifying women\'s health through evidence-based education and compassionate communication.',
      image: config.founder1_image || '',
      accent: '#D4236A',
      light: '#FFF0F6',
      number: '01',
    },
    {
      name: config.founder2_name || 'Dr Sachin Vengat',
      title: config.founder2_title || 'Co-founder & Chief Executive Officer',
      bio: config.founder2_bio || 'With a vision to redefine the future of healthcare, leading NeoFuture at the intersection of medicine, technology, and innovation.',
      image: config.founder2_image || '',
      accent: '#7B35A8',
      light: '#F6F0FF',
      number: '02',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <p className="text-center text-xs text-yellow-700 mb-12 bg-yellow-50 border border-yellow-200 rounded-lg py-2 max-w-sm mx-auto">
        Style E — Minimal Big Number
      </p>

      {/* Header */}
      <div className="text-center mb-20">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Our Team</p>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Meet the <br className="hidden md:block" />Founders</h2>
      </div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        {founders.map((f, i) => {
          const showFallback = !f.image?.trim()
          const initials = f.name.split(' ').map((w) => w[0]).join('').slice(0, 2)

          return (
            <div
              key={i}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Top colored band with big number */}
              <div
                className="relative h-32 flex items-end px-8 pb-4"
                style={{ background: `linear-gradient(135deg, ${f.accent}18, ${f.accent}08)` }}
              >
                <span
                  className="absolute right-6 top-4 text-8xl font-black leading-none select-none"
                  style={{ color: `${f.accent}12` }}
                >
                  {f.number}
                </span>

                {/* Floating avatar */}
                <div className="absolute -bottom-10 left-8">
                  {showFallback ? (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white border-4 border-white"
                      style={{
                        background: `linear-gradient(135deg, ${f.accent}, ${f.accent}cc)`,
                        boxShadow: `0 8px 20px ${f.accent}35`,
                      }}
                    >
                      {initials}
                    </div>
                  ) : (
                    <img
                      src={f.image}
                      alt={f.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white"
                      style={{ boxShadow: `0 8px 20px ${f.accent}35` }}
                    />
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="pt-14 px-8 pb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">{f.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: f.accent }}>
                  {f.title}
                </p>
                <div className="h-0.5 w-8 rounded-full mb-4" style={{ backgroundColor: f.accent }} />
                <p className="text-gray-500 text-sm leading-relaxed">{f.bio}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
