import { getSiteConfig } from '@/lib/settings'

export default async function FoundersPreviewC() {
  const config = await getSiteConfig()

  const founders = [
    {
      name: config.founder1_name || 'Dr Alma Baby',
      title: config.founder1_title || 'Co-founder & Chief Medical Education Officer',
      bio: config.founder1_bio || 'The trusted medical voice of NeoFuture & Neobloom, dedicated to simplifying women\'s health through evidence-based education and compassionate communication.',
      image: config.founder1_image || '',
      accent: '#D4236A',
      tag: 'CMEO',
    },
    {
      name: config.founder2_name || 'Dr Sachin Vengat',
      title: config.founder2_title || 'Co-founder & Chief Executive Officer',
      bio: config.founder2_bio || 'With a vision to redefine the future of healthcare, leading NeoFuture at the intersection of medicine, technology, and innovation.',
      image: config.founder2_image || '',
      accent: '#7B35A8',
      tag: 'CEO',
    },
  ]

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <p className="text-center text-xs text-yellow-700 mb-12 bg-yellow-50 border border-yellow-200 rounded-lg py-2 max-w-sm mx-auto">
        Style C — Magazine / Horizontal Split
      </p>

      {/* Header */}
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Meet Our <span style={{ color: '#D4236A' }}>Founders</span></h2>
        <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mt-5" />
      </div>

      {/* Horizontal cards */}
      <div className="max-w-4xl mx-auto space-y-10">
        {founders.map((f, i) => {
          const isEven = i % 2 === 0
          const showFallback = !f.image?.trim()
          const initials = f.name.split(' ').map((w) => w[0]).join('').slice(0, 2)

          return (
            <div
              key={i}
              className={`flex flex-col md:flex-row ${isEven ? '' : 'md:flex-row-reverse'} gap-0 rounded-3xl overflow-hidden shadow-sm border border-gray-100`}
            >
              {/* Photo side */}
              <div
                className="md:w-56 flex-shrink-0 flex items-center justify-center p-8 md:p-0"
                style={{ background: `linear-gradient(135deg, ${f.accent}15, ${f.accent}08)` }}
              >
                {showFallback ? (
                  <div
                    className="w-28 h-28 md:w-full md:h-full min-h-[200px] flex items-center justify-center text-3xl font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent}bb)` }}
                  >
                    {initials}
                  </div>
                ) : (
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-28 h-28 md:w-full md:h-56 object-cover rounded-2xl md:rounded-none"
                  />
                )}
              </div>

              {/* Text side */}
              <div className="flex-1 p-8 bg-white flex flex-col justify-center">
                {/* Tag */}
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 w-fit"
                  style={{ background: `${f.accent}15`, color: f.accent }}
                >
                  {f.tag}
                </span>

                <h3 className="text-2xl font-bold text-gray-900 mb-1">{f.name}</h3>
                <p className="text-sm font-medium text-gray-500 mb-5">{f.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{f.bio}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
