import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Every public page is statically generated and revalidated on demand.
 * Content changes fan out to the section route, the homepage and the sitemap.
 */
const revalidate = (paths: string[]) => {
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Payload also runs outside a Next request scope (seed scripts, CLI) —
      // there is nothing to revalidate there.
    }
  }
}

export const revalidateCollection =
  (...paths: string[]): CollectionAfterChangeHook =>
  ({ doc }) => {
    revalidate(['/', '/sitemap.xml', ...paths])
    return doc
  }

export const revalidateCollectionDelete =
  (...paths: string[]): CollectionAfterDeleteHook =>
  ({ doc }) => {
    revalidate(['/', '/sitemap.xml', ...paths])
    return doc
  }

export const revalidateGlobal =
  (...paths: string[]): GlobalAfterChangeHook =>
  ({ doc }) => {
    revalidate(['/', '/sitemap.xml', ...paths])
    return doc
  }

/** CTF documents invalidate the index plus the competition they belong to. */
export const revalidateCtf = (slug?: string | null) => {
  revalidate(['/', '/ctf', '/sitemap.xml', ...(slug ? [`/ctf/${slug}`] : [])])
}
