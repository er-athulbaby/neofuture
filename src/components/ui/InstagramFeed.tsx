'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

export default function InstagramFeed({ posts, instagramUrl }: { posts: string[]; instagramUrl?: string }) {
  useEffect(() => {
    function processEmbeds() {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
      }
    }

    if (window.instgrm) {
      processEmbeds()
    } else {
      const existing = document.getElementById('instagram-embed-script')
      if (!existing) {
        const script = document.createElement('script')
        script.id = 'instagram-embed-script'
        script.src = 'https://www.instagram.com/embed.js'
        script.async = true
        script.onload = processEmbeds
        document.body.appendChild(script)
      }
    }
  }, [posts])

  if (!posts.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
      {posts.map((url, i) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <blockquote
          key={i}
          className="instagram-media w-full rounded-2xl overflow-hidden"
          data-instgrm-permalink={url.trim()}
          data-instgrm-version="14"
          data-instgrm-captioned
          style={{
            background: '#FFF',
            border: 0,
            borderRadius: 16,
            boxShadow: '0 0 1px 0 rgba(0,0,0,.5), 0 1px 10px 0 rgba(0,0,0,.15)',
            margin: '0 auto',
            maxWidth: 540,
            minWidth: 280,
            width: '99.375%',
            padding: 0,
          }}
        />
      ))}
    </div>
  )
}
