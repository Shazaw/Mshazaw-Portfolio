import 'server-only'
import { cache } from 'react'
import { getPayloadClient } from './payload'
import type { Post } from '@/payload-types'

export type PostSummary = Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'category' | 'event' | 'challenge' | 'tags' | 'cover' | 'publishedAt' | 'readingMinutes'>

export const getBlogPosts = cache(async (limit = 100): Promise<PostSummary[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { published: { equals: true } },
    sort: ['-publishedAt', 'id'],
    limit,
    pagination: false,
    depth: 1,
    select: {
      title: true, slug: true, excerpt: true, category: true, event: true,
      challenge: true, tags: true, cover: true, publishedAt: true, readingMinutes: true,
    },
  })
  return result.docs
})

export const getBlogPost = cache(async (slug: string): Promise<Post | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] ?? null
})

export const getBlogSitemap = cache(async () => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts', where: { published: { equals: true } },
    limit: 1000, pagination: false, depth: 0,
    select: { slug: true, updatedAt: true },
  })
  return result.docs.filter((post) => Boolean(post.slug))
})
