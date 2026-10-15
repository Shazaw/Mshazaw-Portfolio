import type { MetadataRoute } from 'next'
import { getAllCtfCompetitionSlugs } from '@/lib/data'
import { CTF_ENABLED } from '@/lib/features'
import { getBlogSitemap } from '@/lib/blog-data'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const slugs = CTF_ENABLED ? await getAllCtfCompetitionSlugs() : []
  const now = new Date()
  const posts = await getBlogSitemap()

  const routes = ['', '/projects', '/experience', '/organizations', '/awards', '/blog']
  if (CTF_ENABLED) routes.splice(4, 0, '/ctf')

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
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}

export default sitemap
