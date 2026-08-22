import 'server-only'
import { cache } from 'react'
import { getPayloadClient } from './payload'
import { hasRichText } from './richtext'
import { periodLabel, upper } from './format'
import { SECTIONS } from './sections'
import { CTF_CATEGORY_ORDER } from './ctf'
import type {
  ChamberNode,
  SurveyImage,
  CtfCompetitionItem,
  CtfChallengeItem,
  CtfStats,
  MosaicSpan,
  SectionKey,
  SurveyItem,
  SurveyLink,
} from './types'
import type { Award, Experience, Organization, Profile, Project } from '@/payload-types'

/* ------------------------------------------------------------ helpers ---- */

const toTags = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0).map(upper) : []

const toLinks = (value: unknown): SurveyLink[] =>
  Array.isArray(value)
    ? value
        .map((raw) => raw as { label?: string | null; url?: string | null })
        .filter((raw): raw is { label: string; url: string } => Boolean(raw?.label && raw?.url))
        .map((raw) => ({ label: upper(raw.label), url: raw.url }))
    : []

const toHighlights = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((raw) => (raw as { text?: string | null })?.text)
        .filter((text): text is string => typeof text === 'string' && text.length > 0)
    : []

const span = (value: unknown): MosaicSpan =>
  value === '2' || value === '3' || value === '4' ? value : 'auto'

/**
 * `SEC · E2E` — two mono tokens from the item's own vocabulary. Tokens are
 * never truncated (a clipped `POSTGR` reads as a bug, not a label); short ones
 * are preferred instead, and a second token is only added if the pair fits.
 */
const CORNER_MAX = 16

const cornerLabel = (tags: string[], subtag: string | null, fallback: string): string => {
  const tokens = Array.from(
    new Set([subtag, ...tags].filter((t): t is string => Boolean(t)).map(upper)),
  )
  if (tokens.length === 0) return upper(fallback).slice(0, CORNER_MAX)

  const [first, ...rest] = tokens
  if (first.length > CORNER_MAX) return first
  const partner = rest.find((token) => first.length + token.length + 3 <= CORNER_MAX)
  return partner ? `${first} · ${partner}` : first
}

const artworkFor = (value: unknown, slug: string): string =>
  typeof value === 'string' && value !== 'auto' ? value : `auto:${slug}`

/**
 * Screenshots are optional; the UI falls back to generated artwork without one.
 *
 * Payload reports uploads at `/api/media/file/<name>`, which is a dynamic route.
 * The same files sit in `public/media`, so the static path is preferred — it is
 * cacheable and `next/image` can optimise it straight off disk.
 */
const toImage = (value: unknown, fallbackAlt: string): SurveyImage | null => {
  if (!value || typeof value !== 'object') return null
  const media = value as {
    url?: string | null
    filename?: string | null
    width?: number | null
    height?: number | null
    alt?: string | null
  }
  const url = media.filename ? `/media/${media.filename}` : media.url
  if (!url) return null
  return {
    url,
    width: media.width ?? 1440,
    height: media.height ?? 900,
    alt: media.alt || fallbackAlt,
  }
}

/** Convenience links get a stable label so the buttons read the same everywhere. */
const primaryLinks = (
  repoUrl: unknown,
  liveUrl: unknown,
  extra: SurveyLink[],
): SurveyLink[] => {
  const links: SurveyLink[] = []
  if (typeof repoUrl === 'string' && repoUrl) links.push({ label: 'GITHUB', url: repoUrl })
  if (typeof liveUrl === 'string' && liveUrl) links.push({ label: 'LIVE', url: liveUrl })
  for (const link of extra) {
    if (!links.some((existing) => existing.url === link.url)) links.push(link)
  }
  return links
}

/* -------------------------------------------------------- normalisers ---- */

const fromProject = (doc: Project): SurveyItem => {
  const tags = toTags(doc.tags)
  const subtag = doc.subtag ? upper(doc.subtag) : (tags[0] ?? null)
  const links = primaryLinks(doc.repoUrl, doc.liveUrl, toLinks(doc.links))
  return {
    id: String(doc.id),
    slug: doc.slug ?? '',
    title: doc.title,
    summary: doc.summary,
    subtag,
    kicker: upper(doc.category),
    cornerLabel: cornerLabel(tags, subtag, doc.category),
    periodLabel: null,
    year: doc.year,
    weight: doc.weight,
    tags,
    mosaicSpan: span(doc.mosaicSpan),
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder ?? null,
    artwork: artworkFor(doc.stripArtwork, doc.slug ?? doc.title),
    image: toImage(doc.screenshot, doc.title),
    role: doc.role ?? null,
    repoUrl: doc.repoUrl ?? null,
    liveUrl: doc.liveUrl ?? null,
    links,
    hasDetail: hasRichText(doc.description as never) || links.length > 0,
  }
}

const fromExperience = (doc: Experience): SurveyItem => {
  const tags = toTags(doc.tags)
  const subtag = doc.subtag ? upper(doc.subtag) : (tags[0] ?? null)
  return {
    id: String(doc.id),
    slug: doc.slug ?? '',
    title: doc.title,
    summary: doc.summary,
    subtag,
    kicker: upper(doc.organization),
    cornerLabel: cornerLabel(tags, subtag, doc.employmentType ?? 'ROLE'),
    periodLabel: periodLabel(doc.startDate, doc.endDate, doc.current),
    year: doc.year ?? new Date(doc.startDate).getUTCFullYear(),
    weight: doc.weight,
    tags,
    mosaicSpan: span(doc.mosaicSpan),
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder ?? null,
    artwork: `auto:${doc.slug ?? doc.title}`,
    image: null,
    role: null,
    repoUrl: null,
    liveUrl: null,
    links: toLinks(doc.links),
    hasDetail:
      hasRichText(doc.description as never) ||
      toHighlights(doc.highlights).length > 0 ||
      toLinks(doc.links).length > 0,
  }
}

const fromOrganization = (doc: Organization): SurveyItem => {
  const tags = toTags(doc.tags)
  const subtag = doc.subtag ? upper(doc.subtag) : (tags[0] ?? null)
  return {
    id: String(doc.id),
    slug: doc.slug ?? '',
    title: doc.title,
    summary: doc.summary,
    subtag,
    kicker: upper(doc.role),
    cornerLabel: cornerLabel(tags, subtag, doc.role),
    periodLabel: periodLabel(doc.startDate, doc.endDate, doc.current),
    year: doc.year ?? new Date(doc.startDate).getUTCFullYear(),
    weight: doc.weight,
    tags,
    mosaicSpan: span(doc.mosaicSpan),
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder ?? null,
    artwork: `auto:${doc.slug ?? doc.title}`,
    image: null,
    role: null,
    repoUrl: null,
    liveUrl: null,
    links: toLinks(doc.links),
    hasDetail:
      hasRichText(doc.description as never) ||
      toHighlights(doc.highlights).length > 0 ||
      toLinks(doc.links).length > 0,
  }
}

const fromAward = (doc: Award): SurveyItem => {
  const tags = toTags(doc.tags)
  const subtag = doc.subtag ? upper(doc.subtag) : (tags[0] ?? null)
  return {
    id: String(doc.id),
    slug: doc.slug ?? '',
    title: doc.title,
    summary: doc.summary,
    subtag,
    kicker: upper(doc.placement || doc.issuer),
    cornerLabel: cornerLabel(tags, subtag, doc.scope ?? 'AWARD'),
    periodLabel: upper(doc.issuer),
    year: doc.year ?? new Date(doc.date).getUTCFullYear(),
    weight: doc.weight,
    tags,
    mosaicSpan: span(doc.mosaicSpan),
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder ?? null,
    artwork: `auto:${doc.slug ?? doc.title}`,
    image: null,
    role: null,
    repoUrl: null,
    liveUrl: null,
    links: toLinks(doc.links),
    hasDetail: hasRichText(doc.description as never) || toLinks(doc.links).length > 0,
  }
}

/* ------------------------------------------------------------ queries ---- */

/**
 * Ordering is the same everywhere: weight descending, recency as tiebreak.
 * The chamber depends on it — index 0 is the tallest tower and sits at centre.
 */
const ORDER_SORT = ['-weight', '-year'] as const

export const getSectionItems = cache(async (key: SectionKey): Promise<SurveyItem[]> => {
  const payload = await getPayloadClient()
  const collection = SECTIONS[key].collection

  const result = await payload.find({
    collection,
    where: { published: { equals: true } },
    sort: [...ORDER_SORT],
    limit: 200,
    // depth 1 populates the screenshot upload; nothing deeper is needed.
    depth: 1,
    pagination: false,
  })

  switch (key) {
    case 'projects':
      return (result.docs as Project[]).map(fromProject)
    case 'experience':
      return (result.docs as Experience[]).map(fromExperience)
    case 'organizations':
      return (result.docs as Organization[]).map(fromOrganization)
    case 'awards':
      return (result.docs as Award[]).map(fromAward)
  }
})

/** Top N featured items for a homepage card strip. */
export const getFeaturedItems = cache(async (key: SectionKey, limit = 3): Promise<SurveyItem[]> => {
  const items = await getSectionItems(key)
  const featured = items.filter((item) => item.featured)
  const pool = featured.length > 0 ? featured : items
  return [...pool]
    .sort((a, b) => {
      const ao = a.featuredOrder ?? Number.MAX_SAFE_INTEGER
      const bo = b.featuredOrder ?? Number.MAX_SAFE_INTEGER
      if (ao !== bo) return ao - bo
      if (b.weight !== a.weight) return b.weight - a.weight
      return b.year - a.year
    })
    .slice(0, limit)
})

/** The minimal record set handed to the 3D scene. */
export const toChamberNodes = (items: SurveyItem[]): ChamberNode[] =>
  items.map((item) => ({
    id: item.id,
    slug: item.slug,
    label: item.title,
    sublabel: item.kicker,
    weight: item.weight,
    year: item.year,
  }))

export const getSectionUpdatedAt = cache(async (key: SectionKey): Promise<string | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: SECTIONS[key].collection,
    where: { published: { equals: true } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
  })
  return (result.docs[0] as { updatedAt?: string } | undefined)?.updatedAt ?? null
})

export const getProfile = cache(async (): Promise<Profile> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'profile', depth: 1 }) as Promise<Profile>
})

/* ---------------------------------------------------------------- CTF ---- */

/**
 * The homepage stat is labelled "PODIUMS & FINALS", so a top-three finish or a
 * genuine final counts. A semifinal or quarterfinal does not — matching those
 * on the substring "final" would inflate the number, which is the one thing a
 * portfolio statistic must never do.
 */
const PODIUM = /\b(1st|2nd|3rd|first|second|third|champion|winner|gold|silver|bronze)\b/i
const FINAL = /\bgrand[\s-]?final\b|\bfinals?\b|\bfinalist\b/i
const NOT_FINAL = /\b(semi|quarter)[\s-]?final/i

export const isPodiumOrFinal = (placement?: string | null): boolean => {
  if (!placement) return false
  if (PODIUM.test(placement)) return true
  return FINAL.test(placement) && !NOT_FINAL.test(placement)
}

export const getCtfStats = cache(async (): Promise<CtfStats> => {
  const payload = await getPayloadClient()

  const [solved, authored, competitions] = await Promise.all([
    payload.count({
      collection: 'ctf-challenges',
      where: { and: [{ mode: { equals: 'solved' } }, { published: { equals: true } }] },
    }),
    payload.count({
      collection: 'ctf-challenges',
      where: { and: [{ mode: { equals: 'authored' } }, { published: { equals: true } }] },
    }),
    payload.find({
      collection: 'ctf-competitions',
      where: { published: { equals: true } },
      limit: 500,
      depth: 0,
      pagination: false,
    }),
  ])

  const podiums = competitions.docs.filter((doc) =>
    isPodiumOrFinal((doc as { placement?: string | null }).placement),
  ).length

  return {
    solved: solved.totalDocs,
    authored: authored.totalDocs,
    podiums,
    competitions: competitions.totalDocs,
  }
})

/**
 * Competition mosaic for one mode. Only competitions with at least one
 * challenge in that mode survive, and each carries its own per-category counts.
 */
export const getCtfCompetitions = cache(async (mode: 'solved' | 'authored'): Promise<CtfCompetitionItem[]> => {
  const payload = await getPayloadClient()

  const [competitions, challenges] = await Promise.all([
    payload.find({
      collection: 'ctf-competitions',
      where: { published: { equals: true } },
      sort: ['-date'],
      limit: 500,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'ctf-challenges',
      where: { and: [{ mode: { equals: mode } }, { published: { equals: true } }] },
      limit: 2000,
      depth: 0,
      pagination: false,
    }),
  ])

  const byCompetition = new Map<string, Map<string, number>>()
  for (const raw of challenges.docs) {
    const doc = raw as { competition?: unknown; category?: string }
    const compId = String(typeof doc.competition === 'object' ? (doc.competition as { id: unknown })?.id : doc.competition)
    if (!compId || !doc.category) continue
    const bucket = byCompetition.get(compId) ?? new Map<string, number>()
    bucket.set(doc.category, (bucket.get(doc.category) ?? 0) + 1)
    byCompetition.set(compId, bucket)
  }

  return competitions.docs
    .map((raw) => {
      const doc = raw as unknown as {
        id: unknown
        slug?: string
        title: string
        organizer: string
        team?: string | null
        placement?: string | null
        format?: string | null
        date: string
        year?: number | null
        summary: string
        subtag?: string | null
        tags?: unknown
        weight?: number | null
        links?: unknown
      }
      const counts = byCompetition.get(String(doc.id))
      if (!counts || counts.size === 0) return null

      const categoryCounts = CTF_CATEGORY_ORDER.filter((category) => counts.has(category)).map((category) => ({
        category,
        count: counts.get(category) as number,
      }))

      const tags = toTags(doc.tags)
      const item: CtfCompetitionItem = {
        id: String(doc.id),
        slug: doc.slug ?? '',
        title: doc.title,
        organizer: doc.organizer,
        team: doc.team ?? null,
        placement: doc.placement ?? null,
        format: doc.format ?? 'jeopardy',
        date: doc.date,
        year: doc.year ?? new Date(doc.date).getUTCFullYear(),
        summary: doc.summary,
        subtag: doc.subtag ? upper(doc.subtag) : (tags[0] ?? null),
        tags,
        weight: doc.weight ?? 3,
        links: toLinks(doc.links),
        categoryCounts,
        total: categoryCounts.reduce((sum, entry) => sum + entry.count, 0),
      }
      return item
    })
    .filter((item): item is CtfCompetitionItem => item !== null)
})

export const getCtfCompetitionBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ctf-competitions',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] ?? null
})

export const getCtfChallenges = cache(
  async (competitionId: string, mode: 'solved' | 'authored'): Promise<CtfChallengeItem[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'ctf-challenges',
      where: {
        and: [
          { competition: { equals: competitionId } },
          { mode: { equals: mode } },
          { published: { equals: true } },
        ],
      },
      sort: ['-points', 'title'],
      limit: 1000,
      depth: 0,
      pagination: false,
    })

    return result.docs.map((raw) => {
      const doc = raw as {
        id: unknown
        slug?: string
        title: string
        category: string
        difficulty: string
        points?: number | null
        solves?: number | null
        summary?: string | null
        tags?: unknown
        mode: 'solved' | 'authored'
        writeup?: unknown
        externalUrl?: string | null
      }
      return {
        id: String(doc.id),
        slug: doc.slug ?? '',
        title: doc.title,
        category: doc.category,
        difficulty: doc.difficulty,
        points: doc.points ?? null,
        solves: doc.solves ?? null,
        summary: doc.summary ?? null,
        tags: toTags(doc.tags),
        mode: doc.mode,
        hasWriteup: hasRichText(doc.writeup as never),
        externalUrl: doc.externalUrl ?? null,
        competitionSlug: '',
      }
    })
  },
)

export const getAllCtfCompetitionSlugs = cache(async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ctf-competitions',
    where: { published: { equals: true } },
    limit: 500,
    depth: 0,
    pagination: false,
  })
  return result.docs
    .map((doc) => (doc as { slug?: string }).slug)
    .filter((slug): slug is string => Boolean(slug))
})

export { toHighlights }
