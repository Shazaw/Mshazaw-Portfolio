import type { SectionKey, SectionMeta } from './types'

/**
 * Single source of truth for the four chambered sections.
 * Chapter numbers follow the homepage journey: 00 hello, 01 about,
 * 02 projects, 03 experience, 04 organizations, 05 awards, 06 toolkit.
 * CTF is parked (see src/parked/README.md); restoring it takes 05 back and
 * shifts awards and toolkit down one.
 */
export const SECTIONS: Record<SectionKey, SectionMeta> = {
  projects: {
    key: 'projects',
    num: '02',
    label: 'PROJECTS',
    singular: 'PROJECT',
    route: '/projects',
    heading: 'Selected work',
    blurb: 'Pinned work right now, check out the projects tab for the full list.',
    collection: 'projects',
    stripLayout: 'lead-left',
  },
  experience: {
    key: 'experience',
    num: '03',
    label: 'EXPERIENCE',
    singular: 'ROLE',
    route: '/experience',
    heading: 'Professional Experience',
    blurb: 'Startup development, client consulting, and penetration testing.',
    collection: 'experiences',
    stripLayout: 'lead-right',
  },
  organizations: {
    key: 'organizations',
    num: '04',
    label: 'ORGANIZATIONS',
    singular: 'ORG',
    route: '/organizations',
    heading: 'Organizations I put my time in',
    blurb: 'Software houses, teaching cybersecurity, and student bodies.',
    collection: 'organizations',
    stripLayout: 'even',
  },
  awards: {
    key: 'awards',
    num: '05',
    label: 'AWARDS',
    singular: 'AWARD',
    route: '/awards',
    heading: 'Marks on the board',
    blurb: 'Competitions, placements and recognitions.',
    collection: 'awards',
    stripLayout: 'lead-top',
  },
}

export const SECTION_ORDER: SectionKey[] = ['projects', 'experience', 'organizations', 'awards']

export const sectionByCollection = (collection: string): SectionMeta | undefined =>
  SECTION_ORDER.map((key) => SECTIONS[key]).find((section) => section.collection === collection)

/** `SEC 02 · PROJECTS · UPD 2026-08` */
export const surveyLabel = (section: SectionMeta, updated?: Date | string | null): string => {
  const date = updated ? new Date(updated) : new Date()
  const stamp = Number.isNaN(date.getTime())
    ? ''
    : ` · UPD ${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  return `SEC ${section.num} · ${section.label}${stamp}`
}
