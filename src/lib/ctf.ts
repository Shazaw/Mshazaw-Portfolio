/** Shared CTF taxonomy — used by the Payload schema, the mosaics and the filters. */

export const CTF_CATEGORIES = [
  { value: 'web', label: 'Web', short: 'WEB' },
  { value: 'crypto', label: 'Cryptography', short: 'CRYPTO' },
  { value: 'pwn', label: 'Binary Exploitation', short: 'PWN' },
  { value: 'reverse', label: 'Reverse Engineering', short: 'REV' },
  { value: 'forensics', label: 'Forensics', short: 'FOREN' },
  { value: 'osint', label: 'OSINT', short: 'OSINT' },
  { value: 'steganography', label: 'Steganography', short: 'STEGO' },
  { value: 'hardware', label: 'Hardware / Radio', short: 'HW' },
  { value: 'blockchain', label: 'Blockchain', short: 'CHAIN' },
  { value: 'misc', label: 'Misc', short: 'MISC' },
] as const

export type CtfCategory = (typeof CTF_CATEGORIES)[number]['value']

export const CTF_CATEGORY_ORDER: CtfCategory[] = CTF_CATEGORIES.map((c) => c.value)

export const categoryLabel = (value: string): string =>
  CTF_CATEGORIES.find((c) => c.value === value)?.label ?? value

export const categoryShort = (value: string): string =>
  CTF_CATEGORIES.find((c) => c.value === value)?.short ?? value.toUpperCase()

export const CTF_DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'insane', label: 'Insane' },
] as const

export type CtfDifficulty = (typeof CTF_DIFFICULTIES)[number]['value']

export const CTF_MODES = ['solved', 'authored'] as const
export type CtfMode = (typeof CTF_MODES)[number]

export const isCtfMode = (value: unknown): value is CtfMode =>
  typeof value === 'string' && (CTF_MODES as readonly string[]).includes(value)
