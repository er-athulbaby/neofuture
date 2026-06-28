'use client'

function extractCode(url: string): string | null {
  const m = url.trim().match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : null
}

export default function InstagramFeed({ posts, instagramUrl }: { posts: string[]; instagramUrl?: string }) {
  if (!posts.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((url, i) => {
        const code = extractCode(url)
        if (!code) return null

        return (
          <div key={i} className="rounded-2xl overflow-hidden shadow-md bg-black aspect-[9/16] max-h-[520px]">
            <iframe
              src={`https://www.instagram.com/reel/${code}/embed/`}
              className="w-full h-full border-0"
              allowFullScreen
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              loading="lazy"
            />
          </div>
        )
      })}
    </div>
  )
}
