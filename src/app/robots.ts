import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/cart',
          '/account/',
          '/order/',
          '/doctor/',
          '/verify/',
          '/verify-2fa',
          '/onboarding',
          '/coming-soon',
          '/preview/',
        ],
      },
    ],
    sitemap: 'https://neofuture.in/sitemap.xml',
  }
}
