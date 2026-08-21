import type { MetadataRoute } from 'next'
import { getAllCtfCompetitionSlugs } from '@/lib/data'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const slugs = await getAllCtfCompetitionSlugs()
  const now = new Date()

  const routes = ['', '/about', '/projects', '/experience', '/organizations', '/ctf', '/awards']

  return [
    ...routes.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.8,
    })),
    ...slugs.map((slug) => ({
      url: `${base}/ctf/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}

export default sitemap
