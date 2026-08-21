import type { SectionKey, SectionMeta } from './types'

/**
 * Single source of truth for the four chambered sections.
 * Chapter numbers follow the homepage journey (§5): 00 hello, 01 about,
 * 02 projects, 03 experience, 04 organizations, 05 ctf, 06 awards.
 */
export const SECTIONS: Record<SectionKey, SectionMeta> = {
  projects: {
    key: 'projects',
    num: '02',
    label: 'PROJECTS',
    singular: 'PROJECT',
    route: '/projects',
    heading: 'Selected work',
    blurb: 'Pinned builds. Enter the section to orbit the full cluster.',
    collection: 'projects',
  },
  experience: {
    key: 'experience',
    num: '03',
    label: 'EXPERIENCE',
    singular: 'ROLE',
    route: '/experience',
    heading: 'Where the hours went',
    blurb: 'Engagements, internships and research posts, heaviest first.',
    collection: 'experiences',
  },
  organizations: {
    key: 'organizations',
    num: '04',
    label: 'ORGANIZATIONS',
    singular: 'ORG',
    route: '/organizations',
    heading: 'Rooms I helped run',
    blurb: 'Societies, chapters and student bodies — and what I did inside them.',
    collection: 'organizations',
  },
  awards: {
    key: 'awards',
    num: '06',
    label: 'AWARDS',
    singular: 'AWARD',
    route: '/awards',
    heading: 'Marks on the board',
    blurb: 'Competitions, placements and recognitions.',
    collection: 'awards',
  },
}

export const SECTION_ORDER: SectionKey[] = ['projects', 'experience', 'organizations', 'awards']

export const sectionByCollection = (collection: string): SectionMeta | undefined =>
  SECTION_ORDER.map((key) => SECTIONS[key]).find((section) => section.collection === collection)

/** `SEC 02 · PROJECTS · N=14 · UPD 2026-08` */
export const surveyLabel = (section: SectionMeta, count: number, updated?: Date | string | null): string => {
  const date = updated ? new Date(updated) : new Date()
  const stamp = Number.isNaN(date.getTime())
    ? ''
    : ` · UPD ${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  return `SEC ${section.num} · ${section.label} · N=${count}${stamp}`
}
