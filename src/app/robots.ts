import type { MetadataRoute } from 'next'
import { siteURL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/detail/'] }],
    sitemap: `${siteURL}/sitemap.xml`,
    host: siteURL,
  }
}
