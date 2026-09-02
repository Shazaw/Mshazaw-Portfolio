/** Small display helpers shared by every surface. */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const monthYear = (value?: string | null): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export const fullDate = (value?: string | null): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** `JAN 2025 — PRESENT` */
export const periodLabel = (start?: string | null, end?: string | null, current?: boolean | null): string | null => {
  const from = monthYear(start)
  if (!from) return null
  if (current) return `${from} - PRESENT`
  const to = monthYear(end)
  return to && to !== from ? `${from} - ${to}` : from
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')

/** `01 / 03` — the holo index in a strip footer. */
export const indexOf = (i: number, total: number): string => `${pad2(i + 1)} / ${pad2(total)}`

export const upper = (value?: string | null): string => (value ?? '').toUpperCase()

/** Trims a summary to roughly `words` words without cutting mid-word. */
export const clampWords = (text: string, words: number): string => {
  const parts = text.trim().split(/\s+/)
  if (parts.length <= words) return text.trim()
  return `${parts.slice(0, words).join(' ')}…`
}
