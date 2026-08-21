import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { richTextToHTML } from '@/lib/richtext'
import { upper } from '@/lib/format'
import type { ItemDetail, SurveyLink } from '@/lib/types'

/**
 * Lazy popup bodies (spec §13.5). The chamber payload stays primitive; rich
 * text only crosses the wire when a visitor actually opens a card.
 */
const ALLOWED = {
  projects: 'description',
  experiences: 'description',
  organizations: 'description',
  awards: 'description',
  'ctf-competitions': 'description',
  'ctf-challenges': 'writeup',
} as const

type AllowedCollection = keyof typeof ALLOWED

const isAllowed = (value: string): value is AllowedCollection => value in ALLOWED

const toLinks = (value: unknown): SurveyLink[] =>
  Array.isArray(value)
    ? value
        .map((raw) => raw as { label?: string | null; url?: string | null })
        .filter((raw): raw is { label: string; url: string } => Boolean(raw?.label && raw?.url))
        .map((raw) => ({ label: upper(raw.label), url: raw.url }))
    : []

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ collection: string; slug: string }> },
) => {
  const { collection, slug } = await params

  if (!isAllowed(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 })
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection,
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    depth: 1,
  })

  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const richField = ALLOWED[collection]
  const links = toLinks(doc.links)

  if (collection === 'ctf-challenges') {
    const attachments = Array.isArray(doc.attachments)
      ? (doc.attachments as { file?: { url?: string | null; filename?: string | null } }[])
          .map((entry) => entry.file)
          .filter((file): file is { url: string; filename?: string | null } =>
            Boolean(file && typeof file === 'object' && file.url),
          )
          .map((file) => ({ label: upper(file.filename ?? 'FILE'), url: file.url }))
      : []
    if (doc.externalUrl) links.push({ label: 'SOURCE', url: String(doc.externalUrl) })
    links.push(...attachments)
  }

  const detail: ItemDetail = {
    slug,
    title: String(doc.title ?? ''),
    html: richTextToHTML(doc[richField] as never),
    highlights: Array.isArray(doc.highlights)
      ? (doc.highlights as { text?: string | null }[])
          .map((entry) => entry.text)
          .filter((text): text is string => Boolean(text))
      : [],
    links,
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]).map(upper) : [],
  }

  return NextResponse.json(detail, {
    headers: {
      // Popup bodies change only when the CMS changes; let the CDN hold them.
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
