import type { Payload } from 'payload'
import { blogPosts } from './posts'
import { uploadImage } from './media'

const imageDescriptions: Record<string, string> = {
  'filtereous-burp-positions.png': 'Burp Intruder upload request with filename and Content-Type payload positions',
  'filtereous-burp-results.png': 'Burp Intruder result showing an accepted .php2.gif upload and its public asset URL',
  'filtereous-php-execution.png': 'GIF89a prefix followed by PHP information output from the uploaded file',
}

export const seedBlog = async (payload: Payload) => {
  const media = new Map<string, string | number>()
  const ensureImage = async (filename: string) => {
    const cached = media.get(filename)
    if (cached !== undefined) return cached
    const id = await uploadImage(payload, filename, imageDescriptions[filename] ?? filename)
    if (id === null) throw new Error(`Missing blog screenshot: ${filename}`)
    media.set(filename, id)
    return id
  }

  for (const post of blogPosts) {
    const { cover, sections, ...rest } = post
    const coverId = cover ? await ensureImage(cover) : null
    const resolved = []
    for (const section of sections) {
      const blocks = []
      for (const block of section.blocks) {
        blocks.push(block.blockType === 'image' ? { ...block, image: await ensureImage(block.image) } : block)
      }
      resolved.push({ ...section, blocks })
    }
    const data = { ...rest, cover: coverId, sections: resolved }
    const existing = await payload.find({
      collection: 'posts', where: { slug: { equals: post.slug } }, limit: 1, depth: 0,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'posts', id: existing.docs[0].id, data: data as never, depth: 0 })
    } else {
      await payload.create({ collection: 'posts', data: data as never, depth: 0 })
    }
    console.log(`  published ${post.slug}`)
  }
}
