import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/doctor/', '/account/', '/checkout/', '/cart/'],
      },
    ],
    sitemap: 'https://neofuture.in/sitemap.xml',
  }
}
