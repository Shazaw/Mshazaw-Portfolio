/**
 * Seeded PRNG. Every generated layout (tower footprints, strip artwork,
 * particle field) is seeded from a stable string so reloads are identical
 * and server and client agree (spec §13.3).
 */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a — turns a slug into a stable 32-bit seed. */
export const hashSeed = (value: string): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export const seededRandom = (value: string): (() => number) => mulberry32(hashSeed(value))

/** Deterministic pick from a list, seeded by a string. */
export const seededPick = <T,>(value: string, list: readonly T[]): T =>
  list[Math.floor(seededRandom(value)() * list.length) % list.length]
