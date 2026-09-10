import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://neofuture.in'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/consult`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/neopulse`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tools/due-date`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tools/baby-food`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tools/growth-chart`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tools/vaccination`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tools/weight-gain`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/neo-twin`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
