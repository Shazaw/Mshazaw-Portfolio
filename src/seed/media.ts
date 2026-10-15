import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import type { Payload } from 'payload'

const ASSET_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../seed-assets')

/** Seed uploads are matched by filename so shared images retain one media id. */
export const uploadImage = async (
  payload: Payload,
  filename: string,
  alt: string,
): Promise<string | number | null> => {
  const filePath = path.join(ASSET_DIR, filename)
  if (!existsSync(filePath)) {
    console.warn(`  ! missing asset ${filename}, card will fall back to artwork`)
    return null
  }
  const existing = await payload.find({
    collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0,
  })
  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'media', id: existing.docs[0].id, data: { alt }, depth: 0,
    })
    return updated.id
  }
  const created = await payload.create({ collection: 'media', data: { alt }, filePath, depth: 0 })
  return created.id
}
