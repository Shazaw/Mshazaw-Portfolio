import type { Media } from '@/payload-types'

export const BLOG_CATEGORIES = {
  web: 'Web exploitation',
  pwn: 'Binary exploitation',
  research: 'Security research',
} as const

/** The ordinal makes even repeated section headings produce unique anchors. */
export const sectionAnchor = (index: number, title: string): string =>
  `${String(index + 1).padStart(2, '0')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'}`

const lexicalText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(lexicalText).join(' ')
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: string; root?: unknown; children?: unknown }
  return node.text ?? lexicalText(node.root ?? node.children)
}

/** Prose plus a slower allowance for code; derived whenever a post is saved. */
export const estimateReadingMinutes = (sections: unknown): number => {
  if (!Array.isArray(sections)) return 1
  let proseWords = 0
  let codeLines = 0
  for (const section of sections) {
    for (const block of section.blocks ?? []) {
      if (block.blockType === 'prose') {
        proseWords += lexicalText(block.content).split(/\s+/).filter(Boolean).length
      } else if (block.blockType === 'code') {
        codeLines += String(block.code ?? '').split('\n').length
      }
    }
  }
  return Math.max(1, Math.ceil(proseWords / 220 + codeLines / 45))
}

export const blogImage = (value: number | Media | null | undefined) => {
  if (!value || typeof value !== 'object') return null
  const url = value.filename ? `/media/${value.filename}` : value.url
  if (!url) return null
  return {
    url,
    alt: value.alt,
    width: value.width ?? 1440,
    height: value.height ?? 900,
  }
}

export const blogDate = (value: string): string =>
  new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
