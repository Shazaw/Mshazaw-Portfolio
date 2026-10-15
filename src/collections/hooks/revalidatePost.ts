import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const refresh = (...slugs: (string | null | undefined)[]) => {
  const paths = ['/', '/blog', '/sitemap.xml', ...slugs.filter(Boolean).map((slug) => `/blog/${slug}`)]
  for (const path of new Set(paths)) {
    try {
      revalidatePath(path)
    } catch {
      // The seed and migration CLI also save documents outside a Next request.
    }
  }
}

export const revalidatePost: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  refresh(doc.slug, previousDoc?.slug)
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refresh(doc.slug)
  return doc
}
