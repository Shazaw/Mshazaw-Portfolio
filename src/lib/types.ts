/** Domain types. The UI never touches raw Payload documents — only these. */

export type MosaicSpan = 'auto' | '2' | '3' | '4'

export type SectionKey = 'projects' | 'experience' | 'organizations' | 'awards'

/**
 * The normalised shape every survey collection collapses into.
 * One type keeps the mosaic, the strips, the chamber and the popup generic.
 */
export interface SurveyItem {
  id: string
  slug: string
  /** Display title. */
  title: string
  /** One line — mosaic cells, strip bodies. */
  summary: string
  /** Short mono tag rendered beside the title, e.g. `RUST`. */
  subtag: string | null
  /** The CATEGORY half of the strip footer's `YEAR · CATEGORY`. */
  kicker: string
  /** Two-token mono label in the strip's top-right corner, e.g. `SEC · E2E`. */
  cornerLabel: string
  /** Human period line for the popup, e.g. `JAN 2025 — PRESENT`. */
  periodLabel: string | null
  year: number
  weight: number
  tags: string[]
  mosaicSpan: MosaicSpan
  featured: boolean
  featuredOrder: number | null
  /** Wireframe motif key — the fallback when there is no screenshot. */
  artwork: string
  /** Real screenshot of the running project, when one exists. */
  image: SurveyImage | null
  /** Your part in it, when it needs saying. */
  role: string | null
  repoUrl: string | null
  liveUrl: string | null
  links: SurveyLink[]
  /** True when there is rich text worth fetching for the popup. */
  hasDetail: boolean
}

export interface SurveyLink {
  label: string
  url: string
}

/** An optional real screenshot. Absent means the wireframe artwork is used. */
export interface SurveyImage {
  url: string
  width: number
  height: number
  alt: string
}

/**
 * The minimal record serialised into the chamber payload (spec §1).
 * Deliberately primitive — no rich text ever reaches the 3D scene.
 */
export interface ChamberNode {
  id: string
  slug: string
  label: string
  sublabel: string
  weight: number
  year: number
}

/** Lazily fetched popup body. */
export interface ItemDetail {
  slug: string
  title: string
  html: string
  highlights: string[]
  links: SurveyLink[]
  tags: string[]
}

export interface SectionMeta {
  key: SectionKey
  /** Chapter number used by the eyebrow and survey label, e.g. `02`. */
  num: string
  /** Uppercase section name. */
  label: string
  /** Singular noun used in the popup index line, e.g. `PROJECT`. */
  singular: string
  route: string
  /** Headline on the homepage chapter and the section page. */
  heading: string
  /** Supporting line on the homepage chapter. */
  blurb: string
  /** Payload collection this section reads. */
  collection: 'projects' | 'experiences' | 'organizations' | 'awards'
}

export interface CtfChallengeItem {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string
  points: number | null
  solves: number | null
  summary: string | null
  tags: string[]
  mode: 'solved' | 'authored'
  hasWriteup: boolean
  externalUrl: string | null
  competitionSlug: string
}

export interface CtfCompetitionItem {
  id: string
  slug: string
  title: string
  organizer: string
  team: string | null
  placement: string | null
  format: string
  date: string
  year: number
  summary: string
  subtag: string | null
  tags: string[]
  weight: number
  links: SurveyLink[]
  /** Per-category counts for the active mode, ordered by the shared taxonomy. */
  categoryCounts: { category: string; count: number }[]
  total: number
}

export interface CtfStats {
  solved: number
  authored: number
  podiums: number
  competitions: number
}
